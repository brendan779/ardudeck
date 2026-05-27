/**
 * Ground / Air speed dual readout — pair of big numbers with unit, designed
 * to sit next to the artificial horizon as the "velocity" widget on the
 * FPV canvas.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 240;
const H = 110;

export function SpeedDualReadout({ groundSpeed, airSpeed }: { groundSpeed: number; airSpeed: number }) {
  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />
      <text x={W * 0.05} y={H * 0.18} fill={HUD_COLORS.label} fontSize={H * 0.13} dominantBaseline="middle" letterSpacing={1}>
        SPEED
      </text>

      <Col cx={W * 0.27} y={H * 0.62} value={groundSpeed.toFixed(1)} label="GND (m/s)" />
      <Col cx={W * 0.74} y={H * 0.62} value={airSpeed.toFixed(1)} label="AIR (m/s)" />
    </HudSvg>
  );
}

function Col({ cx, y, value, label }: { cx: number; y: number; value: string; label: string }) {
  return (
    <>
      <text x={cx} y={y} fill={HUD_COLORS.white} fontSize={H * 0.28} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
      <text x={cx} y={y + H * 0.20} fill={HUD_COLORS.label} fontSize={H * 0.11} textAnchor="middle" dominantBaseline="middle" letterSpacing={1}>
        {label}
      </text>
    </>
  );
}
