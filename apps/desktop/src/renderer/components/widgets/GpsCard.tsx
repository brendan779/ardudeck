/**
 * GPS readout card — Skyline-style panel with fix-quality dot, satellite
 * count, HDOP, and altitude. Not a 1:1 port of any single Skyline widget
 * (Skyline's GPSMap is a map), but follows the same chrome + typography.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 240;
const H = 140;

export interface GpsCardProps {
  fixType: number;
  fixLabel: string;
  satellites: number;
  hdop: number;
  altitude: number;
}

function fixColor(fixType: number): string {
  if (fixType >= 4) return HUD_COLORS.good;     // RTK / RTK_FIXED
  if (fixType >= 3) return HUD_COLORS.good;     // 3D fix
  if (fixType >= 2) return HUD_COLORS.warn;     // 2D fix
  return HUD_COLORS.bad;
}

export function GpsCard({ fixType, fixLabel, satellites, hdop, altitude }: GpsCardProps) {
  const color = fixColor(fixType);

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />

      {/* Header */}
      <text x={W * 0.07} y={H * 0.15} fill={HUD_COLORS.label} fontSize={H * 0.115} dominantBaseline="middle" letterSpacing={1}>
        GPS
      </text>

      {/* Fix dot + label */}
      <circle cx={W * 0.08} cy={H * 0.38} r={H * 0.055} fill={color} />
      <circle cx={W * 0.08} cy={H * 0.38} r={H * 0.10} fill={color} opacity={0.18} />
      <text x={W * 0.16} y={H * 0.38} fill={HUD_COLORS.white} fontSize={H * 0.17} dominantBaseline="middle">
        {fixLabel}
      </text>

      {/* Three readout columns: sats / hdop / alt */}
      <Stat cx={W * 0.20} y={H * 0.72} label="SATS" value={String(satellites)} h={H} />
      <Stat cx={W * 0.50} y={H * 0.72} label="HDOP" value={hdop.toFixed(1)} h={H} />
      <Stat cx={W * 0.82} y={H * 0.72} label="ALT" value={`${altitude.toFixed(0)}m`} h={H} />
    </HudSvg>
  );
}

function Stat({ cx, y, label, value, h }: { cx: number; y: number; label: string; value: string; h: number }) {
  return (
    <>
      <text x={cx} y={y} fill={HUD_COLORS.white} fontSize={h * 0.18} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
      <text x={cx} y={y + h * 0.13} fill={HUD_COLORS.label} fontSize={h * 0.09} textAnchor="middle" dominantBaseline="middle" letterSpacing={1}>
        {label}
      </text>
    </>
  );
}
