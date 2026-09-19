import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID")!;
const FCM_SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON")!);

async function getToken() {
  const header = btoa(JSON.stringify({alg:"RS256",typ:"JWT"})).replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
  const now=Math.floor(Date.now()/1000);
  const payload=btoa(JSON.stringify({
    iss:FCM_SERVICE_ACCOUNT.client_email,
    scope:"https://www.googleapis.com/auth/firebase.messaging",
    aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600
  })).replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
  const pem=FCM_SERVICE_ACCOUNT.private_key.replace("-----BEGIN PRIVATE KEY-----","").replace("-----END PRIVATE KEY-----","").replace(/\s/g,"");
  const der=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey("pkcs8",der,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(header+"."+payload)));
  const signature=btoa(String.fromCharCode(...sig)).replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:header+"."+payload+"."+signature})});
  if(!r.ok) throw new Error(await r.text());
  return (await r.json()).access_token;
}

Deno.serve(async req => {
  try {
    const body=await req.json();
    if(!body.title || !body.body) return Response.json({error:"title and body are required"},{status:400});
    const token=await getToken();
    const r=await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify({message:{topic:"all",notification:{title:body.title,body:body.body},data:body.link?{link:body.link}:{}}})
    });
    const result=await r.text();
    if(!r.ok) return Response.json({error:result},{status:500});
    return Response.json({ok:true,result:JSON.parse(result)});
  } catch(e) {
    return Response.json({error:String(e)},{status:500});
  }
});