package com.truelytech.habitency.plugins;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.truelytech.habitency.services.PomodoroForegroundService;

@CapacitorPlugin(name = "PomodoroForeground")
public class PomodoroForegroundPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Long endAtEpochMs = call.getLong("endAtEpochMs");
        String title = call.getString("title");
        String body = call.getString("body");

        if (endAtEpochMs == null || endAtEpochMs <= 0) {
            call.reject("endAtEpochMs is required");
            return;
        }

        Intent intent = new Intent(getContext(), PomodoroForegroundService.class);
        intent.putExtra(PomodoroForegroundService.EXTRA_END_AT_EPOCH_MS, endAtEpochMs);
        intent.putExtra(PomodoroForegroundService.EXTRA_TITLE, title);
        intent.putExtra(PomodoroForegroundService.EXTRA_BODY, body);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), PomodoroForegroundService.class);
        getContext().stopService(intent);
        call.resolve();
    }
}
