package com.jetpurkarate.app

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class JetpurFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // MainActivity also registers the token. This method is intentionally lightweight.
    }
    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: "Jetpur Karate"
        val body = message.notification?.body ?: message.data["message"] ?: "New notification"
        val link = message.data["link"]
        val intent = Intent(this, MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP; if (!link.isNullOrBlank()) putExtra("link", link) }
        val pending = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(this, "jetpurkarate").setSmallIcon(R.drawable.ic_notification).setContentTitle(title).setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH).setContentIntent(pending).build()
        NotificationManagerCompat.from(this).notify(System.currentTimeMillis().toInt(), n)
    }
}
