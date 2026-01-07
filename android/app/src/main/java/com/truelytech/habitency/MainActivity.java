package com.truelytech.habitency;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

import com.truelytech.habitency.plugins.UpdateInstallerPlugin;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		registerPlugin(UpdateInstallerPlugin.class);
		
		// Keep WebView in memory and prevent it from being destroyed
		if (this.bridge != null && this.bridge.getWebView() != null) {
			WebView webView = this.bridge.getWebView();
			webView.getSettings().setDomStorageEnabled(true);
			webView.getSettings().setDatabaseEnabled(true);
			webView.setWebContentsDebuggingEnabled(true);
		}
	}
	
	@Override
	protected void onSaveInstanceState(Bundle outState) {
		super.onSaveInstanceState(outState);
		// Save WebView state to prevent refresh
		if (this.bridge != null && this.bridge.getWebView() != null) {
			this.bridge.getWebView().saveState(outState);
		}
	}
	
	@Override
	protected void onRestoreInstanceState(Bundle savedInstanceState) {
		super.onRestoreInstanceState(savedInstanceState);
		// Restore WebView state
		if (this.bridge != null && this.bridge.getWebView() != null && savedInstanceState != null) {
			this.bridge.getWebView().restoreState(savedInstanceState);
		}
	}
	
	@Override
	protected void onPause() {
		super.onPause();
		// Don't pause WebView timers to keep Pomodoro running
		if (this.bridge != null && this.bridge.getWebView() != null) {
			this.bridge.getWebView().onResume();
		}
	}
}
