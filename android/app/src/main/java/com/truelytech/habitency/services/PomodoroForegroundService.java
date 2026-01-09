package com.truelytech.habitency.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.truelytech.habitency.R;

public class PomodoroForegroundService extends Service {
    public static final String EXTRA_END_AT_EPOCH_MS = "endAtEpochMs";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";

    private static final String CHANNEL_ID = "habitency_pomodoro_running";
    private static final int NOTIFICATION_ID = 42420;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        long endAtEpochMs = intent.getLongExtra(EXTRA_END_AT_EPOCH_MS, 0L);
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);

        createChannelIfNeeded();

        Notification notification = buildNotification(endAtEpochMs, title, body);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForeground(NOTIFICATION_ID, notification);
        } else {
            //noinspection deprecation
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;

        NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
        if (existing != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Pomodoro Running",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Shows the running Pomodoro timer");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    private Notification buildNotification(long endAtEpochMs, String title, String body) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent == null) {
            launchIntent = new Intent();
        }
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title != null ? title : "Pomodoro")
                .setContentText(body != null ? body : "Timer is running")
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(contentIntent)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        // Show a live countdown in the notification shade.
        // Uses the system chronometer UI; no manual updates required.
        if (endAtEpochMs > 0) {
            builder.setWhen(endAtEpochMs);
            builder.setUsesChronometer(true);
            try {
                builder.setChronometerCountDown(true);
            } catch (Throwable ignored) {
                // Some support library versions/devices may not support countdown chronometer.
            }
        }

        return builder.build();
    }
}
