import { useRef } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { useVideoSource } from '../../hooks/useVideoSource';

/**
 * Full-bleed video layer rendered behind the FPV canvas. Picks the first
 * configured source by default and routes it through useVideoSource, which
 * handles UDP RTP / RTSP (via go2rtc WHEP) and USB capture cards (via
 * getUserMedia) transparently.
 */
export function FpvVideoBackground() {
  const sources = useSettingsStore((s) => s.videoSources) ?? [];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const source = sources[0] ?? null;
  const { status, errorMsg } = useVideoSource(videoRef, source);

  return (
    <div className="absolute inset-0 bg-black pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!source && (
        <div className="absolute inset-0 flex items-center justify-center text-content-secondary text-sm pointer-events-auto">
          Configure a source in Settings → FPV Video Sources.
        </div>
      )}
      {status === 'error' && (
        <div className="absolute top-2 left-2 text-xs text-red-300 bg-red-900/60 px-2 py-1 rounded pointer-events-auto" title={errorMsg ?? ''}>
          Video error: {errorMsg}
        </div>
      )}
    </div>
  );
}
