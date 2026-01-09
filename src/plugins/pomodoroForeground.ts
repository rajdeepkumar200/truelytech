import { registerPlugin } from '@capacitor/core';

export type PomodoroForegroundPlugin = {
  start(options: { endAtEpochMs: number; title: string; body: string }): Promise<void>;
  stop(): Promise<void>;
};

export const PomodoroForeground = registerPlugin<PomodoroForegroundPlugin>('PomodoroForeground');
