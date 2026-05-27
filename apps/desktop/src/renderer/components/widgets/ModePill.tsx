/**
 * Mode pill — port of Skyline's ModePillWidget.swift. Compact pill showing
 * the flight mode name, with an armed/disarmed dot before it.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 260;
const H = 70;

export function ModePill({ mode, armed }: { mode: string; armed: boolean }) {
  const dotR = H * 0.16;
  const dotCx = W * 0.10;
  const dotCy = H * 0.5;
  const dotColor = armed ? HUD_COLORS.bad : HUD_COLORS.good;
  const dotLabel = armed ? 'ARMED' : 'DISARMED';

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />

      <circle cx={dotCx} cy={dotCy} r={dotR} fill={dotColor} />
      {/* Soft glow halo around the dot. */}
      <circle cx={dotCx} cy={dotCy} r={dotR * 1.7} fill={dotColor} opacity={0.18} />

      <text
        x={dotCx + dotR + W * 0.025}
        y={H * 0.38}
        fill={HUD_COLORS.label}
        fontSize={H * 0.18}
        dominantBaseline="middle"
        letterSpacing={1.2}
      >
        {dotLabel}
      </text>
      <text
        x={dotCx + dotR + W * 0.025}
        y={H * 0.70}
        fill={HUD_COLORS.white}
        fontSize={H * 0.32}
        fontWeight={600}
        dominantBaseline="middle"
        letterSpacing={1.5}
      >
        {(mode || '—').toUpperCase()}
      </text>
    </HudSvg>
  );
}
