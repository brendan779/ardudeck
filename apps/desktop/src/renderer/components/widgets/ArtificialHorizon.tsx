/**
 * Artificial horizon widget — faithful port of Skyline's
 * ArtificialHorizonWidget.swift. Rotating sky/ground split, pitch ladder,
 * fixed roll arc with an accent pointer, and the fixed aircraft reticle.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 200;
const H = 200;
const CX = W / 2;
const CY = H / 2;

export function ArtificialHorizon({ roll, pitch }: { roll: number; pitch: number }) {
  const pxPerDeg = H / 55;
  const horizon = pitch * pxPerDeg;
  const big = Math.max(W, H) * 2.4;
  const cornerR = H * 0.12;

  // Pitch ladder rungs (10, 20 above + below the visible window).
  const ladder: { y: number; half: number; deg: number }[] = [];
  for (let a = -20; a <= 20; a += 10) {
    if (a === 0) continue;
    const y = (pitch - a) * pxPerDeg;
    const half = Math.abs(a) === 20 ? W * 0.15 : W * 0.10;
    ladder.push({ y, half, deg: a });
  }

  // Roll arc — drawn in the fixed (un-rotated) frame.
  const arcCx = CX;
  const arcCy = CY + H * 0.34;
  const arcR = H * 0.66;
  const arcStart = -150 * (Math.PI / 180);
  const arcEnd = -30 * (Math.PI / 180);
  const arcStartPt = `${arcCx + arcR * Math.cos(arcStart)},${arcCy + arcR * Math.sin(arcStart)}`;
  const arcEndPt = `${arcCx + arcR * Math.cos(arcEnd)},${arcCy + arcR * Math.sin(arcEnd)}`;
  const arcPath = `M ${arcStartPt} A ${arcR} ${arcR} 0 0 1 ${arcEndPt}`;

  // Roll-arc tick marks at fixed positions.
  const arcTicks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let tick = -60; tick <= 60; tick += 30) {
    const ang = ((-90 + tick) * Math.PI) / 180;
    const r1 = arcR - (tick === 0 ? H * 0.07 : H * 0.045);
    arcTicks.push({
      x1: arcCx + Math.cos(ang) * arcR,
      y1: arcCy + Math.sin(ang) * arcR,
      x2: arcCx + Math.cos(ang) * r1,
      y2: arcCy + Math.sin(ang) * r1,
    });
  }

  // Roll-arc pointer triangle — at the current roll angle, pointing inward.
  const pAng = ((-90 + roll) * Math.PI) / 180;
  const px = arcCx + Math.cos(pAng) * (arcR - H * 0.02);
  const py = arcCy + Math.sin(pAng) * (arcR - H * 0.02);
  const psz = H * 0.055;
  const p0x = px, p0y = py;
  const p1x = px - psz * Math.cos(pAng - 0.45);
  const p1y = py - psz * Math.sin(pAng - 0.45);
  const p2x = px - psz * Math.cos(pAng + 0.45);
  const p2y = py - psz * Math.sin(pAng + 0.45);
  const ptrPath = `M ${p0x},${p0y} L ${p1x},${p1y} L ${p2x},${p2y} Z`;

  // Fixed aircraft reticle.
  const arm = W * 0.16;
  const dot = Math.max(2, H * 0.018);

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <defs>
        <clipPath id="ah-panel-clip">
          <rect x={0} y={0} width={W} height={H} rx={cornerR} ry={cornerR} />
        </clipPath>
      </defs>

      <PanelChrome w={W} h={H} />

      {/* Rotating world — sky, ground, horizon line, pitch ladder. */}
      <g clipPath="url(#ah-panel-clip)">
        <g transform={`translate(${CX} ${CY}) rotate(${-roll})`}>
          <rect x={-big} y={-big} width={2 * big} height={big + horizon} fill={HUD_COLORS.sky} />
          <rect x={-big} y={horizon} width={2 * big} height={2 * big} fill={HUD_COLORS.ground} />
          <line x1={-big} y1={horizon} x2={big} y2={horizon} stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
          {ladder.map(({ y, half, deg }) => (
            <g key={deg}>
              <line x1={-half} y1={y} x2={half} y2={y} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
              <text x={half + W * 0.035} y={y} fill="rgba(255,255,255,0.6)" fontSize={H * 0.085} dominantBaseline="middle">
                {Math.abs(deg)}
              </text>
              <text x={-half - W * 0.035} y={y} fill="rgba(255,255,255,0.6)" fontSize={H * 0.085} dominantBaseline="middle" textAnchor="end">
                {Math.abs(deg)}
              </text>
            </g>
          ))}
        </g>
      </g>

      {/* Roll arc + ticks + accent pointer (fixed frame). */}
      <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      {arcTicks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={HUD_COLORS.majorTick} strokeWidth={1} />
      ))}
      <path d={ptrPath} fill={HUD_COLORS.accent} />

      {/* Fixed aircraft reticle. */}
      <line x1={CX - arm} y1={CY} x2={CX - dot * 2} y2={CY} stroke={HUD_COLORS.white} strokeWidth={2} />
      <line x1={CX + dot * 2} y1={CY} x2={CX + arm} y2={CY} stroke={HUD_COLORS.white} strokeWidth={2} />
      <circle cx={CX} cy={CY} r={dot} fill={HUD_COLORS.white} />

      {/* "ATT" label at top. */}
      <text x={CX} y={H * 0.09} fill={HUD_COLORS.label} fontSize={H * 0.10} textAnchor="middle" dominantBaseline="middle" letterSpacing={1}>
        ATT
      </text>
    </HudSvg>
  );
}
