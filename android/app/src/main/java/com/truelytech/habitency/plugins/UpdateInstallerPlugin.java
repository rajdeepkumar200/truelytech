package com.truelytech.habitency.plugins;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "UpdateInstaller")
public class UpdateInstallerPlugin extends Plugin {

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    private void rejectOnMainThread(PluginCall call, String message) {
        getActivity().runOnUiThread(() -> call.reject(message));
    }

    private void rejectOnMainThread(PluginCall call, String message, Exception error) {
        getActivity().runOnUiThread(() -> call.reject(message, error));
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String urlString = call.getString("url");
        if (urlString == null || urlString.isEmpty()) {
            call.reject("Missing url");
            return;
        }

        EXECUTOR.execute(() -> {
            try {
                // Download APK to cache
                URL url = new URL(urlString);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.connect();

                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) {
                    rejectOnMainThread(call, "Download failed: HTTP " + code);
                    return;
                }

                File outFile = new File(getContext().getCacheDir(), "habitex-update.apk");
                try (InputStream in = connection.getInputStream();
                     FileOutputStream out = new FileOutputStream(outFile, false)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    out.flush();
                }

                // For Android O+ the user must allow "Install unknown apps" for this app.
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
                    if (!canInstall) {
                        Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getActivity().runOnUiThread(() -> getActivity().startActivity(intent));

                        rejectOnMainThread(call, "Install permission required. Enable 'Install unknown apps' then try again.");
                        return;
                    }
                }

                // Launch system installer
                Uri apkUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        outFile
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                getActivity().runOnUiThread(() -> {
                    try {
                        getActivity().startActivity(intent);
                        JSObject ret = new JSObject();
                        ret.put("started", true);
                        call.resolve(ret);
                        // Best-effort: close the app so the installer can finish,
                        // and the user can tap "Open" after update.
                        getActivity().finish();
                    } catch (Exception e) {
                        call.reject("Failed to start installer", e);
                    }
                });
            } catch (Exception e) {
                rejectOnMainThread(call, "Update failed", e);
            }
        });
    }
}
