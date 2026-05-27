import { useEffect, useState } from 'react';
import type { VideoSource } from '../../../shared/ipc-channels';
import { useSettingsStore } from '../../stores/settings-store';

/**
 * FPV video sources — three source types:
 *  - UDP RTP H.264 (Cosmostreamer / QGC / Mission Planner / Herelink / Skydroid)
 *  - RTSP pull
 *  - USB-C capture card (handled entirely browser-side via getUserMedia;
 *    bypasses the go2rtc sidecar)
 *
 * The sidecar only needs to run when there's at least one udp-rtp / rtsp
 * source. Capture-card-only setups can leave it stopped.
 */
export function VideoSourcesSettings() {
  const videoSources = useSettingsStore((s) => s.videoSources);
  const addVideoSource = useSettingsStore((s) => s.addVideoSource);
  const updateVideoSource = useSettingsStore((s) => s.updateVideoSource);
  const removeVideoSource = useSettingsStore((s) => s.removeVideoSource);

  const [sidecarRunning, setSidecarRunning] = useState(false);
  const [sidecarError, setSidecarError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const status = await window.electronAPI?.videoGetStatus();
      if (mounted) setSidecarRunning(!!status?.isRunning);
    };
    refresh();
    const off = window.electronAPI?.onVideoExit(() => {
      if (mounted) setSidecarRunning(false);
    });
    const offErr = window.electronAPI?.onVideoError((err) => {
      if (mounted) setSidecarError(err);
    });
    return () => {
      mounted = false;
      off?.();
      offErr?.();
    };
  }, []);

  // Enumerate capture devices on mount and whenever a device is plugged/unplugged.
  // Labels are empty until the user has granted at least one getUserMedia
  // permission, so we prime that with a throwaway call.
  useEffect(() => {
    let mounted = true;
    async function refreshDevices() {
      try {
        // Prime permission so labels show. Stop the stream immediately.
        try {
          const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          probe.getTracks().forEach((t) => t.stop());
        } catch { /* user denied or no devices — labels will be blank */ }
        const all = await navigator.mediaDevices.enumerateDevices();
        if (mounted) setDevices(all.filter((d) => d.kind === 'videoinput'));
      } catch (err) {
        console.warn('[VideoSettings] device enumeration failed:', err);
      }
    }
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, []);

  const hasSidecarSource = (videoSources ?? []).some(
    (s) => s.type === 'udp-rtp' || s.type === 'rtsp',
  );

  async function applyAndRestart() {
    setSidecarError(null);
    // Only pass sidecar-relevant sources to the main process — capture-card
    // sources are entirely browser-side.
    const sidecarSources = (videoSources ?? []).filter(
      (s) => s.type === 'udp-rtp' || s.type === 'rtsp',
    );
    const res = await window.electronAPI?.videoStart(sidecarSources);
    if (res?.success) {
      setSidecarRunning(true);
    } else {
      setSidecarError(res?.error ?? 'Failed to start sidecar');
      setSidecarRunning(false);
    }
  }

  async function stop() {
    await window.electronAPI?.videoStop();
    setSidecarRunning(false);
  }

  function handleAddUdp() {
    addVideoSource({
      id: `cam${(videoSources?.length ?? 0) + 1}`,
      name: 'New UDP source',
      type: 'udp-rtp',
      port: 5600,
    });
  }

  function handleAddRtsp() {
    addVideoSource({
      id: `cam${(videoSources?.length ?? 0) + 1}`,
      name: 'New RTSP source',
      type: 'rtsp',
      url: '',
    });
  }

  function handleAddCaptureCard(device: MediaDeviceInfo) {
    addVideoSource({
      id: `cam${(videoSources?.length ?? 0) + 1}`,
      name: device.label || 'USB Capture',
      type: 'capture-card',
      deviceId: device.deviceId,
      deviceLabel: device.label,
    });
  }

  return (
    <div className="bg-surface rounded-xl border border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-content">FPV Video Sources</h3>
          <p className="text-xs text-content-secondary mt-1">
            UDP RTP / RTSP go through the go2rtc sidecar. USB capture cards play directly in the browser — no sidecar needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${sidecarRunning ? 'bg-emerald-500' : 'bg-zinc-500'}`}
            title={sidecarRunning ? 'Sidecar running' : 'Sidecar stopped'}
          />
          <span className="text-xs text-content-secondary">
            Sidecar {sidecarRunning ? 'running' : 'stopped'}
          </span>
        </div>
      </div>

      {sidecarError && (
        <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
          {sidecarError}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {(videoSources ?? []).length === 0 && (
          <div className="text-xs text-content-secondary italic py-3 text-center">
            No sources configured yet.
          </div>
        )}
        {(videoSources ?? []).map((src) => (
          <SourceRow
            key={src.id}
            source={src}
            devices={devices}
            onUpdate={(updates) => updateVideoSource(src.id, updates)}
            onDelete={() => removeVideoSource(src.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={handleAddUdp}
          className="px-3 py-1.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-content"
        >
          + UDP RTP
        </button>
        <button
          onClick={handleAddRtsp}
          className="px-3 py-1.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-content"
        >
          + RTSP
        </button>
        <CaptureCardDropdown devices={devices} onPick={handleAddCaptureCard} />
        <div className="flex-1" />
        {hasSidecarSource && (
          <>
            <button
              onClick={applyAndRestart}
              className="px-3 py-1.5 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {sidecarRunning ? 'Restart sidecar' : 'Start sidecar'}
            </button>
            {sidecarRunning && (
              <button
                onClick={stop}
                className="px-3 py-1.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-content"
              >
                Stop
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CaptureCardDropdown({
  devices,
  onPick,
}: {
  devices: MediaDeviceInfo[];
  onPick: (d: MediaDeviceInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-content"
      >
        + Capture Card {devices.length > 0 ? `(${devices.length})` : ''}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-72 rounded shadow-lg bg-zinc-900 border border-subtle overflow-hidden">
          {devices.length === 0 ? (
            <div className="px-3 py-2 text-xs text-content-secondary">
              No video input devices detected.
            </div>
          ) : (
            devices.map((d) => (
              <button
                key={d.deviceId}
                onClick={() => { onPick(d); setOpen(false); }}
                className="block w-full text-left px-3 py-1.5 text-xs text-content hover:bg-zinc-800"
              >
                {d.label || `Device ${d.deviceId.slice(0, 8)}`}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SourceRow({
  source,
  devices,
  onUpdate,
  onDelete,
}: {
  source: VideoSource;
  devices: MediaDeviceInfo[];
  onUpdate: (updates: Partial<VideoSource>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-zinc-800/50 border border-subtle">
      <input
        type="text"
        value={source.id}
        onChange={(e) => onUpdate({ id: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
        placeholder="id"
        className="w-24 px-2 py-1 text-xs bg-zinc-900 border border-subtle rounded text-content font-mono"
        title="Source ID (used in WHEP URL / canvas dropdown)"
      />
      <input
        type="text"
        value={source.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Display name"
        className="flex-1 px-2 py-1 text-xs bg-zinc-900 border border-subtle rounded text-content"
      />
      <span className="text-xs text-content-secondary px-2 uppercase">{source.type}</span>
      {source.type === 'udp-rtp' && (
        <input
          type="number"
          value={source.port ?? 5600}
          onChange={(e) => onUpdate({ port: Number(e.target.value) || 5600 })}
          className="w-20 px-2 py-1 text-xs bg-zinc-900 border border-subtle rounded text-content font-mono"
          title="UDP port"
        />
      )}
      {source.type === 'rtsp' && (
        <input
          type="text"
          value={source.url ?? ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="rtsp://user:pass@host:port/path"
          className="flex-1 px-2 py-1 text-xs bg-zinc-900 border border-subtle rounded text-content font-mono"
        />
      )}
      {source.type === 'capture-card' && (
        <select
          value={source.deviceId ?? ''}
          onChange={(e) => {
            const dev = devices.find((d) => d.deviceId === e.target.value);
            onUpdate({ deviceId: e.target.value, deviceLabel: dev?.label });
          }}
          className="flex-1 px-2 py-1 text-xs bg-zinc-900 border border-subtle rounded text-content"
          title="Capture device"
        >
          {!devices.find((d) => d.deviceId === source.deviceId) && (
            <option value={source.deviceId ?? ''}>
              {source.deviceLabel || '(device not currently connected)'}
            </option>
          )}
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Device ${d.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={onDelete}
        className="px-2 py-1 text-xs rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
        title="Remove source"
      >
        ✕
      </button>
    </div>
  );
}
