import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID")!;
const FCM_SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON")!);

async function accessToken() {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
  const now = Math.floor(Date.now()/1000);
  const payload = btoa(JSON.stringify({
    iss: FCM_SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })).replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");

  const pem = FCM_SERVICE_ACCOUNT.private_key
    .replace("-----BEGIN PRIVATE KEY-----","")
    .replace("-----END PRIVATE KEY-----","")
    .replace(/\s/g,"");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der,
    { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" },
    false, ["sign"]
  );
  const input = new TextEncoder().encode(header + "." + payload);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, input));
  const signature = btoa(String.fromCharCode(...sig))
    .replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({
      grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: header+"."+payload+"."+signature
    })
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()).access_token;
}

async function sendTopic(title:string, body:string, link?:string) {
  const token = await accessToken();
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
    {
      method:"POST",
      headers:{
        "Authorization":`Bearer ${token}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        message:{
          topic:"all",
          notification:{title, body},
          data: link ? {link} : {}
        }
      })
    }
  );
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

Deno.serve(async (req) => {
  try {
    const now = new Date();

    const { data: schedules, error: scheduleError } = await supabase
      .from("notification_schedules")
      .select("*")
      .eq("status","scheduled")
      .lte("scheduled_at", now.toISOString())
      .order("scheduled_at")
      .limit(50);

    if (scheduleError) throw scheduleError;

    let sent = 0;

    for (const item of schedules ?? []) {
      try {
        await sendTopic(item.title, item.body, item.link ?? undefined);
        await supabase.from("notification_schedules").update({
          status:"sent", sent_at:new Date().toISOString(), error_message:null
        }).eq("id", item.id);
        sent++;
      } catch (e) {
        await supabase.from("notification_schedules").update({
          status:"failed", error_message:String(e)
        }).eq("id", item.id);
      }
    }

    const dateText = now.toISOString().slice(0,10);
    const year = now.getUTCFullYear();
    const { data: birthdays, error: birthdayError } = await supabase
      .from("birthdays")
      .select("*")
      .eq("notification_enabled", true)
      .eq("birth_date", dateText);

    if (birthdayError) throw birthdayError;

    for (const person of birthdays ?? []) {
      if (person.last_notified_year === year) continue;
      try {
        await sendTopic(
          "🎂 Happy Birthday!",
          `Happy Birthday to ${person.person_name}!${person.branch_name ? " - " + person.branch_name : ""}`
        );
        await supabase.from("birthdays").update({
          last_notified_year: year, updated_at:new Date().toISOString()
        }).eq("id", person.id);
        sent++;
      } catch (e) {
        console.error("Birthday notification failed", person.id, e);
      }
    }

    return Response.json({ok:true, sent});
  } catch (e) {
    return Response.json({ok:false, error:String(e)}, {status:500});
  }
});