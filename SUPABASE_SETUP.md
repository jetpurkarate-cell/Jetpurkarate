# Jetpur Karate Team - Supabase Notification Setup

The Android app subscribes to the FCM topic `all`. This notification system is separate from the existing website data/API.

## 1. Create/choose Supabase project

Run `supabase/migrations/202609190001_notification_system.sql` in the Supabase SQL Editor.

## 2. Edge Function secrets

Set these secrets in Supabase Edge Functions:

- `FCM_PROJECT_ID=jetpur-karate`
- `FCM_SERVICE_ACCOUNT_JSON=<Firebase service-account JSON>`
- `SUPABASE_SERVICE_ROLE_KEY=<Supabase server secret>`

Do NOT put the service-account JSON or service-role key in GitHub Pages/browser code.

FCM HTTP v1 requires server-side authorization. The Firebase `google-services.json` used by the Android app is not the server credential for sending messages.

## 3. Deploy functions

Deploy:
- `supabase/functions/send-now`
- `supabase/functions/process-notifications`

## 4. Schedule the processor

Use Supabase Cron/pg_cron to invoke `process-notifications` every minute. Supabase supports scheduled Edge Function invocation with pg_cron + pg_net.

## 5. Panel

The panel is in `notification-panel/index.html`. Put the Supabase project URL and publishable key in that file. The publishable key is intended for browser use, but RLS policies must restrict who can write notification/birthday records.

The Edge Functions should remain server-side and hold the FCM service account credentials.

## 6. Birthday behavior

A daily/continuous processor checks today's month/day. When a person's birthday matches, it sends one notification for that calendar year and stores `last_notified_year`, preventing duplicate birthday notifications.

## 7. Schedule behavior

A scheduled record is sent once when `scheduled_at <= now()`. After successful sending it becomes `sent`; failures are marked `failed`.

References:
- Supabase scheduled Edge Functions: https://supabase.com/docs/guides/functions/schedule-functions
- Supabase secrets: https://supabase.com/docs/guides/functions/secrets
- Firebase FCM HTTP v1: https://firebase.google.com/docs/cloud-messaging/send/v1-api
