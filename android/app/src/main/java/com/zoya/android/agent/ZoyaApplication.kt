package com.zoya.android.agent

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

class ZoyaApplication : Application() {

    companion object {
        const val VOICE_SERVICE_CHANNEL_ID = "zoya_voice_service_channel"
        const val ALERTS_CHANNEL_ID = "zoya_alerts_channel"
        lateinit var instance: ZoyaApplication
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Voice Foreground Service Channel
            val voiceChannel = NotificationChannel(
                VOICE_SERVICE_CHANNEL_ID,
                "Zoya Voice Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows continuous voice listening status and background assistant state"
                setShowBadge(false)
            }

            // High-priority Alert/Confirmation Channel
            val alertChannel = NotificationChannel(
                ALERTS_CHANNEL_ID,
                "Zoya Action Confirmations",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Requires explicit user confirmation for high-risk operations"
                enableVibration(true)
            }

            notificationManager.createNotificationChannel(voiceChannel)
            notificationManager.createNotificationChannel(alertChannel)
        }
    }
}
