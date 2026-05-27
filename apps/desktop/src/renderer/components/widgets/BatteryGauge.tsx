/**
 * Battery gauge — port of Skyline's BatteryWidget.swift. Horizontal fuel
 * gauge with green/yellow/red zones, voltage/current/charge readouts.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 260;
const H = 130;

function zoneColor(fraction: number, override?: string): string {
  if (override) return override;
  if (fraction > 0.5) return HUD_COLORS.good;
  if (fraction > 0.2) return HUD_COLORS.warn;
  return HUD_COLORS.bad;
}

export interface BatteryGaugeProps {
  voltage: number;      // V
  current: number;      // A
  /** Remaining percentage 0-100, or null when unknown. */
  remainingPct: number | null;
  hasData: boolean;
  accent?: string;
}

export function BatteryGauge({ voltage, current, remainingPct, hasData, accent }: BatteryGaugeProps) {
  const remaining = remainingPct != null ? Math.max(0, Math.min(1, remainingPct / 100)) : null;
  const color = remaining != null ? zoneColor(remaining, accent) : HUD_COLORS.label;

  const barX = W * 0.06;
  const barY = H * 0.30;
  const barH = H * 0.24;
  const capW = W * 0.025;
  const barW = W * 0.85 - capW - 3;

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />

      {/* Header: BATTERY ......... 87% */}
      <text x={barX} y={H * 0.18} fill={HUD_COLORS.label} fontSize={H * 0.135} dominantBaseline="middle" letterSpacing={1}>
        BATTERY
      </text>
      {remaining != null && (
        <text
          x={W - W * 0.06}
          y={H * 0.18}
          fill={color}
          fontSize={H * 0.16}
          fontWeight={600}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {Math.round(remaining * 100)}%
        </text>
      )}

      {/* Trough */}
      <rect x={barX} y={barY} width={barW} height={barH} rx={barH * 0.25} ry={barH * 0.25} fill="rgba(0,0,0,0.55)" />
      {remaining != null && hasData && (
        <rect
          x={barX}
          y={barY}
          width={Math.max(barH * 0.5, barW * remaining)}
          height={barH}
          rx={barH * 0.25}
          ry={barH * 0.25}
          fill={color}
        />
      )}
      <rect
        x={barX}
        y={barY}
        width={barW}
        height={barH}
        rx={barH * 0.25}
        ry={barH * 0.25}
        fill="none"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth={1}
      />
      {/* Cap nub on the right end of the trough */}
      <rect
        x={barX + barW + 3}
        y={barY + barH * 0.28}
        width={capW}
        height={barH * 0.44}
        rx={capW * 0.4}
        ry={capW * 0.4}
        fill="rgba(255,255,255,0.30)"
      />

      {/* Numeric readouts — voltage / current / (mAh placeholder) */}
      <ReadoutCol cx={W * 0.21} y={H * 0.78} value={hasData ? voltage.toFixed(1) : '—'} unit="V" h={H} />
      <ReadoutCol cx={W * 0.50} y={H * 0.78} value={hasData ? Math.abs(current).toFixed(1) : '—'} unit="A" h={H} />
      <ReadoutCol cx={W * 0.80} y={H * 0.78} value={remaining != null ? `${Math.round(remaining * 100)}` : '—'} unit="%" h={H} />
    </HudSvg>
  );
}

function ReadoutCol({ cx, y, value, unit, h }: { cx: number; y: number; value: string; unit: string; h: number }) {
  return (
    <>
      <text x={cx} y={y - h * 0.06} fill={HUD_COLORS.white} fontSize={h * 0.18} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
      <text x={cx} y={y + h * 0.10} fill={HUD_COLORS.label} fontSize={h * 0.10} textAnchor="middle" dominantBaseline="middle" letterSpacing={1}>
        {unit}
      </text>
    </>
  );
}
