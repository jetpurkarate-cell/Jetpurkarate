package com.jetpurkarate.app;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class JetpurFirebaseMessagingService extends FirebaseMessagingService {
    @Override public void onMessageReceived(RemoteMessage message) {
        String title = message.getNotification() != null && message.getNotification().getTitle() != null ? message.getNotification().getTitle() : value(message.getData().get("title"), "Jetpur Karate");
        String body = message.getNotification() != null && message.getNotification().getBody() != null ? message.getNotification().getBody() : value(message.getData().get("message"), "New notification");
        Intent intent = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String link = message.getData().get("link"); if (link != null && !link.trim().isEmpty()) intent.putExtra("link", link);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT; if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pending = PendingIntent.getActivity(this, 0, intent, flags);
        NotificationCompat.Builder n = new NotificationCompat.Builder(this, "jetpurkarate").setSmallIcon(R.drawable.ic_notification).setContentTitle(title).setContentText(body).setStyle(new NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH).setContentIntent(pending);
        try { NotificationManagerCompat.from(this).notify((int)(System.currentTimeMillis() & 0x7fffffff), n.build()); } catch (SecurityException ignored) {}
    }
    private String value(String v, String fallback) { return v == null || v.trim().isEmpty() ? fallback : v; }
}
