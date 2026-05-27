import { useEffect, useRef, useState, RefObject } from 'react';

export type CaptureStatus = 'idle' | 'connecting' | 'playing' | 'error';

/**
 * Subscribe a `<video>` element to a USB capture-card stream via
 * `getUserMedia`. Independent of the go2rtc sidecar — the browser handles
 * the device directly. Re-runs when the deviceId changes.
 */
export function useCaptureCardStream(videoRef: RefObject<HTMLVideoElement | null>, deviceId: string | null) {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('connecting');
    setErrorMsg(null);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // `exact` so it errors instead of silently picking a different
          // camera (e.g. the built-in webcam) when the device is unplugged.
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('playing');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [deviceId, videoRef]);

  return { status, errorMsg };
}
