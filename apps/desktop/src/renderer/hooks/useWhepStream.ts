import { useEffect, useRef, useState, RefObject } from 'react';

const GO2RTC_API = 'http://127.0.0.1:1984';

export type WhepStatus = 'idle' | 'connecting' | 'playing' | 'error';

/**
 * Subscribe a <video> element to a go2rtc-served WHEP stream. Re-runs when
 * the source id changes. Caller owns the <video> element via ref.
 */
export function useWhepStream(videoRef: RefObject<HTMLVideoElement | null>, sourceId: string | null) {
  const [status, setStatus] = useState<WhepStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!sourceId) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('connecting');
    setErrorMsg(null);

    const pc = new RTCPeerConnection({ iceServers: [] });
    pcRef.current = pc;
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    const stream = new MediaStream();
    if (videoRef.current) videoRef.current.srcObject = stream;

    pc.ontrack = (evt) => {
      stream.addTrack(evt.track);
      if (videoRef.current) videoRef.current.srcObject = stream;
    };

    (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const res = await fetch(
          `${GO2RTC_API}/api/webrtc?src=${encodeURIComponent(sourceId)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: offer.sdp,
          },
        );
        if (!res.ok) throw new Error(`WHEP ${res.status}: ${await res.text()}`);
        const answerSdp = await res.text();
        if (cancelled) return;
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
        if (!cancelled) setStatus('playing');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      try { pc.close(); } catch { /* ignore */ }
      if (videoRef.current) videoRef.current.srcObject = null;
      pcRef.current = null;
    };
  }, [sourceId, videoRef]);

  return { status, errorMsg };
}
