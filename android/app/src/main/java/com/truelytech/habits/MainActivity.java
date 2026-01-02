package com.truelytech.habits;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

import com.truelytech.habits.plugins.UpdateInstallerPlugin;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		registerPlugin(UpdateInstallerPlugin.class);
	}
}
