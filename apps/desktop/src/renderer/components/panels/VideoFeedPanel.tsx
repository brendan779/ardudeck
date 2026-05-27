import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { useVideoSource } from '../../hooks/useVideoSource';

/**
 * Video Feed panel — plays any configured video source (UDP RTP / RTSP via
 * the go2rtc sidecar, or a USB capture card directly via getUserMedia).
 * Source-type branching lives in useVideoSource.
 */
export function VideoFeedPanel() {
  const sources = useSettingsStore((s) => s.videoSources) ?? [];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(sources[0]?.id ?? null);

  useEffect(() => {
    if (selectedId && !sources.find((s) => s.id === selectedId)) {
      setSelectedId(sources[0]?.id ?? null);
    } else if (!selectedId && sources[0]) {
      setSelectedId(sources[0].id);
    }
  }, [sources, selectedId]);

  const source = sources.find((s) => s.id === selectedId) ?? null;
  const { status, errorMsg } = useVideoSource(videoRef, source);

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="flex items-center gap-2 px-2 py-1 bg-zinc-900/80 border-b border-subtle text-xs">
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="px-2 py-1 bg-zinc-800 border border-subtle rounded text-content"
        >
          {sources.length === 0 && <option value="">(no sources configured)</option>}
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{s.name} [{s.type}]</option>
          ))}
        </select>
        <span className={
          status === 'playing' ? 'text-emerald-400'
          : status === 'connecting' ? 'text-yellow-400'
          : status === 'error' ? 'text-red-400'
          : 'text-content-secondary'
        }>
          {status}
        </span>
        {errorMsg && <span className="text-red-400 truncate" title={errorMsg}>{errorMsg}</span>}
      </div>
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
        {!selectedId && (
          <div className="absolute inset-0 flex items-center justify-center text-content-secondary text-sm">
            Configure a source in Settings → FPV Video Sources.
          </div>
        )}
      </div>
    </div>
  );
}
