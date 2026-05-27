/**
 * Video module — IPC handler registration for the go2rtc sidecar.
 */

import { ipcMain, BrowserWindow } from 'electron';
import type { VideoSource } from '../../shared/ipc-channels.js';
import { IPC_CHANNELS } from '../../shared/ipc-channels.js';
import { go2rtcProcess } from './go2rtc-process.js';

export function setupVideoIpcHandlers(mainWindow: BrowserWindow): void {
  go2rtcProcess.setMainWindow(mainWindow);

  ipcMain.handle(IPC_CHANNELS.VIDEO_START, async (_evt, sources: VideoSource[]) => {
    return go2rtcProcess.start(sources ?? []);
  });

  ipcMain.handle(IPC_CHANNELS.VIDEO_STOP, async () => {
    await go2rtcProcess.stopAndWait();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.VIDEO_STATUS, async () => {
    return go2rtcProcess.getStatus();
  });
}

export function shutdownVideo(): void {
  go2rtcProcess.stop();
}
