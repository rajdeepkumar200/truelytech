import { registerPlugin } from '@capacitor/core';

export interface UpdateInstallerPlugin {
  downloadAndInstall(options: { url: string }): Promise<void>;
}

export const UpdateInstaller = registerPlugin<UpdateInstallerPlugin>('UpdateInstaller');
