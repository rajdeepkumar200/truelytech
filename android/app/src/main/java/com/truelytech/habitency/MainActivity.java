package com.truelytech.habitency;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.os.Build;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;

import com.truelytech.habitency.plugins.UpdateInstallerPlugin;
import com.truelytech.habitency.plugins.PomodoroForegroundPlugin;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		// Ensure the app content is laid out below system bars (status bar / notch
		// area)
		WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
		// Avoid drawing into the display cutout (notch) area.
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
			WindowManager.LayoutParams lp = getWindow().getAttributes();
			lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
			getWindow().setAttributes(lp);
		}

		super.onCreate(savedInstanceState);

		registerPlugin(UpdateInstallerPlugin.class);
		registerPlugin(PomodoroForegroundPlugin.class);

		// Keep WebView in memory and prevent it from being destroyed
		if (this.bridge != null && this.bridge.getWebView() != null) {
			WebView webView = this.bridge.getWebView();
			webView.getSettings().setDomStorageEnabled(true);
			webView.getSettings().setDatabaseEnabled(true);
			webView.setWebContentsDebuggingEnabled(true);
		}
	}

	@Override
	public void onSaveInstanceState(Bundle outState) {
		super.onSaveInstanceState(outState);
		// Save WebView state to prevent refresh
		if (this.bridge != null && this.bridge.getWebView() != null) {
			this.bridge.getWebView().saveState(outState);
		}
	}

	@Override
	public void onRestoreInstanceState(Bundle savedInstanceState) {
		super.onRestoreInstanceState(savedInstanceState);
		// Restore WebView state
		if (this.bridge != null && this.bridge.getWebView() != null && savedInstanceState != null) {
			this.bridge.getWebView().restoreState(savedInstanceState);
		}
	}

	@Override
	public void onPause() {
		super.onPause();
		// Don't pause WebView timers to keep Pomodoro running
		if (this.bridge != null && this.bridge.getWebView() != null) {
			this.bridge.getWebView().onResume();
		}
	}
}
