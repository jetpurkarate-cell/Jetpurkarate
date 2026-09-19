package com.jetpurkarate.app;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class JetpurFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "jetpurkarate";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        String title = message.getNotification() != null && message.getNotification().getTitle() != null
                ? message.getNotification().getTitle()
                : value(message.getData().get("title"), "Jetpur Karate Team");

        String body = message.getNotification() != null && message.getNotification().getBody() != null
                ? message.getNotification().getBody()
                : value(message.getData().get("message"), "New notification");

        Intent intent = new Intent(this, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        String link = message.getData().get("link");
        if (link != null && (link.startsWith("https://") || link.startsWith("http://"))) {
            intent.putExtra("link", link);
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;

        PendingIntent pending = PendingIntent.getActivity(this, 0, intent, flags);

        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pending);

        try {
            NotificationManagerCompat.from(this)
                    .notify((int) (System.currentTimeMillis() & 0x7fffffff), notification.build());
        } catch (SecurityException ignored) {
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        com.google.firebase.messaging.FirebaseMessaging.getInstance()
                .subscribeToTopic("all");
    }

    private String value(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}