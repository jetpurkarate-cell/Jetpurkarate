import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID");
const SERVICE_ACCOUNT_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function getToken() {
  if (!FCM_PROJECT_ID || !SERVICE_ACCOUNT_JSON) {
    throw new Error("FCM configuration is missing in Supabase Edge Function secrets.");
  }

  let account: any;
  try {
    account = JSON.parse(SERVICE_ACCOUNT_JSON);
  } catch {
    throw new Error("FCM_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  const pem = account.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8", der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const sig = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", key,
    new TextEncoder().encode(header + "." + payload)
  ));
  const signature = btoa(String.fromCharCode(...sig))
    .replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: header + "." + payload + "." + signature
    })
  });

  const text = await response.text();
  if (!response.ok) throw new Error("Google OAuth error: " + text);

  const tokenData = JSON.parse(text);
  if (!tokenData.access_token) throw new Error("Google OAuth did not return an access token.");
  return tokenData.access_token;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "POST required" }, 405);

    const body = await req.json();
    const title = String(body.title || "").trim();
    const messageBody = String(body.body || "").trim();
    const link = String(body.link || "").trim();

    if (!title || !messageBody) {
      return json({ error: "Notification title and message are required." }, 400);
    }

    const token = await getToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            topic: "all",
            notification: { title, body: messageBody },
            data: link ? { link } : {}
          }
        })
      }
    );

    const resultText = await response.text();
    if (!response.ok) {
      return json({ error: "Firebase notification failed.", details: resultText }, 502);
    }

    return json({ ok: true, result: JSON.parse(resultText) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});