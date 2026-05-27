import { RefObject } from 'react';
import type { VideoSource } from '../../shared/ipc-channels';
import { useWhepStream } from './useWhepStream';
import { useCaptureCardStream } from './useCaptureCardStream';

export type VideoStatus = 'idle' | 'connecting' | 'playing' | 'error';

/**
 * Branches between the go2rtc/WHEP path (UDP RTP and RTSP sources) and the
 * direct browser path (USB capture cards via getUserMedia). Both hooks run
 * unconditionally so React's hook-order rule isn't violated; the inactive
 * one bails on a null id and produces 'idle'. The final status returned is
 * whichever path is "live" for the current source type.
 */
export function useVideoSource(
  videoRef: RefObject<HTMLVideoElement | null>,
  source: VideoSource | null,
): { status: VideoStatus; errorMsg: string | null } {
  const whepId = source && (source.type === 'udp-rtp' || source.type === 'rtsp') ? source.id : null;
  const captureId = source && source.type === 'capture-card' ? (source.deviceId ?? null) : null;

  const whep = useWhepStream(videoRef, whepId);
  const capture = useCaptureCardStream(videoRef, captureId);

  if (!source) return { status: 'idle', errorMsg: null };
  if (source.type === 'capture-card') return capture;
  return whep;
}
