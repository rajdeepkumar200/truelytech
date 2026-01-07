package com.truelytech.habitency.plugins;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.content.pm.PackageInstaller;
import android.provider.Settings;

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
    private static final String ACTION_INSTALL_STATUS = "com.truelytech.habitency.INSTALL_STATUS";

    private PluginCall pendingInstallCall;
    private BroadcastReceiver installStatusReceiver;

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

        // Keep the call alive until the installation result returns.
        call.setKeepAlive(true);
        pendingInstallCall = call;

        EXECUTOR.execute(() -> {
            try {
                // Download APK to cache
                URL url = new URL(urlString);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setUseCaches(false);
                connection.setRequestProperty("Cache-Control", "no-cache");
                connection.setRequestProperty("Pragma", "no-cache");
                connection.connect();

                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) {
                    rejectOnMainThread(call, "Download failed: HTTP " + code);
                    call.setKeepAlive(false);
                    pendingInstallCall = null;
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
                        call.setKeepAlive(false);
                        pendingInstallCall = null;
                        return;
                    }
                }

                // Install via PackageInstaller so we can wait for completion.
                PackageInstaller installer = getContext().getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                int sessionId = installer.createSession(params);
                PackageInstaller.Session session = installer.openSession(sessionId);

                try (InputStream in = new java.io.FileInputStream(outFile);
                     java.io.OutputStream out = session.openWrite("habitex-update", 0, -1)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    session.fsync(out);
                }

                registerInstallReceiverIfNeeded();

                Intent statusIntent = new Intent(ACTION_INSTALL_STATUS);
                statusIntent.setPackage(getContext().getPackageName());

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        getContext(),
                        sessionId,
                        statusIntent,
                        flags
                );

                session.commit(pendingIntent.getIntentSender());
                session.close();
            } catch (Exception e) {
                rejectOnMainThread(call, "Update failed", e);
                call.setKeepAlive(false);
                pendingInstallCall = null;
            }
        });
    }

    private void registerInstallReceiverIfNeeded() {
        if (installStatusReceiver != null) return;

        installStatusReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!ACTION_INSTALL_STATUS.equals(intent.getAction())) return;

                PluginCall call = pendingInstallCall;
                if (call == null) return;

                int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
                String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);

                if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                    Intent confirmIntent = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                    if (confirmIntent != null) {
                        confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getActivity().runOnUiThread(() -> getContext().startActivity(confirmIntent));
                    }
                    return;
                }

                if (status == PackageInstaller.STATUS_SUCCESS) {
                    JSObject ret = new JSObject();
                    ret.put("installed", true);
                    call.resolve(ret);
                    call.setKeepAlive(false);
                    pendingInstallCall = null;

                    // Restart app (best-effort).
                    Intent launch = getContext().getPackageManager().getLaunchIntentForPackage(getContext().getPackageName());
                    if (launch != null) {
                        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        getActivity().runOnUiThread(() -> {
                            try {
                                getContext().startActivity(launch);
                                getActivity().finishAffinity();
                            } catch (Exception ignored) {
                                // If restart fails, user can open from installer.
                            }
                        });
                    }
                } else {
                    String err = (message != null && !message.isEmpty()) ? message : ("Install failed (status " + status + ")");
                    call.reject(err);
                    call.setKeepAlive(false);
                    pendingInstallCall = null;
                }

                // Clean up receiver after terminal status.
                try {
                    getContext().unregisterReceiver(installStatusReceiver);
                } catch (Exception ignored) {
                }
                installStatusReceiver = null;
            }
        };

        IntentFilter filter = new IntentFilter(ACTION_INSTALL_STATUS);
        if (Build.VERSION.SDK_INT >= 33) {
            getContext().registerReceiver(installStatusReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(installStatusReceiver, filter);
        }
    }
}
