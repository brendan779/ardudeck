/**
 * Heading compass ribbon — port of Skyline's HeadingCompassWidget.swift.
 * Tick marks every 5°, cardinal letters and three-digit degrees every 10°,
 * with a centre cursor pointing at the current heading.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 420;
const H = 70;
const CARDINALS: Record<number, string> = {
  0: 'N', 45: 'NE', 90: 'E', 135: 'SE',
  180: 'S', 225: 'SW', 270: 'W', 315: 'NW',
};

export function HeadingCompass({ heading }: { heading: number }) {
  const cx = W / 2;
  const pxPerDeg = W / 80;
  const head = ((Math.round(heading) % 360) + 360) % 360;

  const ticks: { x: number; major: boolean; label: string | null }[] = [];
  for (let off = -45; off <= 45; off++) {
    const deg = ((head + off) % 360 + 360) % 360;
    if (deg % 5 !== 0) continue;
    const x = cx + off * pxPerDeg;
    if (x < 2 || x > W - 2) continue;
    const major = deg % 10 === 0;
    const card = CARDINALS[deg];
    const label = major ? (card ?? String(deg).padStart(3, '0')) : null;
    ticks.push({ x, major, label });
  }

  // Caret pointing down at center.
  const caretH = H * 0.32;
  const caretW = H * 0.34;
  const caret = `M ${cx},${caretH} L ${cx - caretW / 2},0 L ${cx + caretW / 2},0 Z`;

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />
      <g>
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x}
              y1={0}
              x2={t.x}
              y2={t.major ? H * 0.34 : H * 0.18}
              stroke={t.major ? HUD_COLORS.majorTick : HUD_COLORS.minorTick}
              strokeWidth={1}
            />
            {t.label && (
              <text
                x={t.x}
                y={H * 0.66}
                fill={CARDINALS[(parseInt(t.label, 10) % 360 + 360) % 360] ? HUD_COLORS.accent : 'rgba(255,255,255,0.7)'}
                fontSize={CARDINALS[(parseInt(t.label, 10) % 360 + 360) % 360] ? H * 0.40 : H * 0.30}
                fontWeight={CARDINALS[(parseInt(t.label, 10) % 360 + 360) % 360] ? 600 : 400}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* Center cursor */}
      <line x1={cx} y1={0} x2={cx} y2={H} stroke={HUD_COLORS.accent} strokeOpacity={0.7} strokeWidth={1} />
      <path d={caret} fill={HUD_COLORS.accent} />

      {/* Current heading numeric overlay (top-right) so you don't have to read the ribbon. */}
      <text
        x={W - 6}
        y={H * 0.30}
        fill={HUD_COLORS.white}
        fontSize={H * 0.32}
        fontWeight={600}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {String(head).padStart(3, '0')}°
      </text>
    </HudSvg>
  );
}
