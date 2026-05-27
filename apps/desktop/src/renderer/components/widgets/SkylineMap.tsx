/**
 * FPV-style flight track map — Skyline aesthetic, no map tiles.
 *
 * Live adaptation of Skyline/Render/Widgets/GPSMapWidget.swift: dark
 * translucent panel, accumulated flight track in accent color, home dot,
 * accent dot at the current position. No basemap (Skyline cached a MapKit
 * snapshot of the whole flight; we have a live feed and no offline tiles
 * dep), so the panel itself is the backdrop.
 *
 * Projects geo coords to pixels using a flat equirectangular approximation
 * scaled to the visible area. Auto-fits the bounding box of the accumulated
 * track + home + current position, with a small padding margin.
 */
import { useEffect, useRef, useState } from 'react';
import { useTelemetryStore } from '../../stores/telemetry-store';
import { useMissionStore } from '../../stores/mission-store';
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 240;
const H = 240;
/** Maximum points to retain — keeps SVG path under a few KB. */
const MAX_TRACK = 1000;
/** Minimum geographic distance (degrees) between successive samples — avoids
 *  hammering the path with redundant points when sitting still. */
const MIN_DELTA = 1e-6;

interface Point { lat: number; lon: number }

export function SkylineMap() {
  const pos = useTelemetryStore((s) => s.position);
  const home = useMissionStore((s) => s.homePosition);
  const trackRef = useRef<Point[]>([]);
  const [, force] = useState(0);

  // Accumulate the live position into a track buffer. Throttled by MIN_DELTA
  // so we don't spam points while stationary; redraws only when the track
  // actually grew.
  useEffect(() => {
    if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lon) || (pos.lat === 0 && pos.lon === 0)) return;
    const t = trackRef.current;
    const last = t[t.length - 1];
    if (!last || Math.abs(last.lat - pos.lat) > MIN_DELTA || Math.abs(last.lon - pos.lon) > MIN_DELTA) {
      t.push({ lat: pos.lat, lon: pos.lon });
      if (t.length > MAX_TRACK) t.splice(0, t.length - MAX_TRACK);
      force((n) => n + 1);
    }
  }, [pos.lat, pos.lon]);

  const track = trackRef.current;
  const homePt = home && Number.isFinite(home.lat) && Number.isFinite(home.lon) && (home.lat !== 0 || home.lon !== 0)
    ? { lat: home.lat, lon: home.lon } : null;
  const currentPt = Number.isFinite(pos.lat) && Number.isFinite(pos.lon) && (pos.lat !== 0 || pos.lon !== 0)
    ? { lat: pos.lat, lon: pos.lon } : null;

  // Bounding box of everything we want to render. If we have no data yet,
  // bail early to the empty state.
  const allPoints: Point[] = [...track];
  if (homePt) allPoints.push(homePt);
  if (currentPt) allPoints.push(currentPt);
  if (allPoints.length === 0) return <EmptyState text="WAITING FOR GPS" />;

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const p of allPoints) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  // Pad so a single point doesn't collapse to a 0-area box (and so the
  // edge dots aren't clipped by the panel border).
  const padLat = Math.max((maxLat - minLat) * 0.15, 1e-5);
  const padLon = Math.max((maxLon - minLon) * 0.15, 1e-5);
  minLat -= padLat; maxLat += padLat;
  minLon -= padLon; maxLon += padLon;

  // Equirectangular projection, preserving aspect by scaling lon by
  // cos(centerLat) so the projection isn't visibly stretched.
  const centerLat = (minLat + maxLat) / 2;
  const lonScale = Math.cos((centerLat * Math.PI) / 180);
  const dLat = maxLat - minLat;
  const dLon = (maxLon - minLon) * lonScale;
  const inset = 12;
  const fitW = W - 2 * inset;
  const fitH = H - 2 * inset;
  const s = Math.min(fitW / dLon, fitH / dLat);
  const offX = (W - dLon * s) / 2;
  const offY = (H - dLat * s) / 2;

  function project(p: Point): { x: number; y: number } {
    return {
      x: offX + (p.lon - minLon) * lonScale * s,
      // SVG y is downward, geographic lat is upward — flip.
      y: offY + (maxLat - p.lat) * s,
    };
  }

  // Build the accumulated path. Use a single 'M ... L ... L ...' string.
  let pathD = '';
  if (track.length >= 2) {
    const projected = track.map(project);
    pathD = `M ${projected[0]!.x},${projected[0]!.y}`;
    for (let i = 1; i < projected.length; i++) {
      pathD += ` L ${projected[i]!.x},${projected[i]!.y}`;
    }
    // Extend the line to the current position so the dot meets the trail.
    if (currentPt) {
      const p = project(currentPt);
      pathD += ` L ${p.x},${p.y}`;
    }
  }

  const homeProj = homePt ? project(homePt) : null;
  const currentProj = currentPt ? project(currentPt) : null;

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <defs>
        <clipPath id="skyline-map-clip">
          <rect x={0} y={0} width={W} height={H} rx={H * 0.07} ry={H * 0.07} />
        </clipPath>
      </defs>
      <PanelChrome w={W} h={H} />

      <g clipPath="url(#skyline-map-clip)">
        {/* Subtle reference grid so the path doesn't float in pure black. */}
        <Grid />

        {/* Flight path. */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={HUD_COLORS.accent}
            strokeWidth={Math.max(2, H * 0.012)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Home marker — white inner dot, faint outer ring. */}
        {homeProj && (
          <g>
            <circle cx={homeProj.x} cy={homeProj.y} r={H * 0.040} fill="none" stroke={HUD_COLORS.white} strokeOpacity={0.6} />
            <circle cx={homeProj.x} cy={homeProj.y} r={H * 0.020} fill={HUD_COLORS.white} />
          </g>
        )}

        {/* Current position — accent dot with halo + white outline. */}
        {currentProj && (
          <g>
            <circle cx={currentProj.x} cy={currentProj.y} r={H * 0.055} fill={HUD_COLORS.accent} opacity={0.28} />
            <circle cx={currentProj.x} cy={currentProj.y} r={H * 0.030} fill={HUD_COLORS.accent} stroke={HUD_COLORS.white} strokeWidth={1} />
          </g>
        )}
      </g>

      {/* Label and legend. */}
      <text x={W * 0.07} y={H * 0.10} fill={HUD_COLORS.label} fontSize={H * 0.07} dominantBaseline="middle" letterSpacing={1}>
        TRACK
      </text>
      <text x={W * 0.93} y={H * 0.10} fill={HUD_COLORS.label} fontSize={H * 0.055} textAnchor="end" dominantBaseline="middle">
        {track.length} pts
      </text>
    </HudSvg>
  );
}

function Grid() {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i < 6; i++) {
    const x = (W * i) / 6;
    const y = (H * i) / 6;
    lines.push({ x1: x, y1: 0, x2: x, y2: H });
    lines.push({ x1: 0, y1: y, x2: W, y2: y });
  }
  return (
    <g>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
    </g>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />
      <text x={W * 0.07} y={H * 0.10} fill={HUD_COLORS.label} fontSize={H * 0.07} dominantBaseline="middle" letterSpacing={1}>
        TRACK
      </text>
      <text x={W / 2} y={H / 2} fill={HUD_COLORS.label} fontSize={H * 0.075} textAnchor="middle" dominantBaseline="middle" letterSpacing={1}>
        {text}
      </text>
    </HudSvg>
  );
}
