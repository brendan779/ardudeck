/**
 * Vertical tape — port of Skyline's TapeWidget.swift. Used for altitude,
 * ground/airspeed, etc. Scrolling tick rail centered on the current value
 * with a readout box (accent left edge + pointer triangle) on the right.
 */
import { HudSvg, PanelChrome, HUD_COLORS } from './skyline-widget';

const W = 110;
const H = 220;

const SPAN = 60; // total value range covered by the rail
const MAJOR = 10;
const MINOR = 2;

export interface TapeProps {
  /** Current value to display. */
  value: number;
  /** Unit shown under the readout (e.g. "m", "m/s"). */
  unit: string;
  /** Section header at the top (e.g. "ALT", "SPD"). */
  label: string;
  /** Override the accent color (e.g. for low-battery / overspeed). */
  accent?: string;
}

export function Tape({ value, unit, label, accent = HUD_COLORS.accent }: TapeProps) {
  const railTop = H * 0.18;
  const railBottom = H * 0.96;
  const railH = railBottom - railTop;
  const railX = W * 0.34;
  const railMid = railTop + railH / 2;
  const pxPerUnit = railH / SPAN;

  // Generate ticks across the visible window plus one major step of padding
  // so labels at the edges don't pop in/out abruptly.
  const ticks: { y: number; isMajor: boolean; label: number }[] = [];
  let v = Math.floor((value - SPAN / 2 - MAJOR) / MINOR) * MINOR;
  while (v <= value + SPAN / 2 + MAJOR) {
    const y = railMid - (v - value) * pxPerUnit;
    if (y >= railTop - 2 && y <= railBottom + 2) {
      const isMajor = Math.round(v) % MAJOR === 0;
      ticks.push({ y, isMajor, label: Math.round(v) });
    }
    v += MINOR;
  }

  // Readout box — accent left edge, pointer toward the rail, value + unit.
  const boxW = W * 0.52;
  const boxH = H * 0.32;
  const boxX = W - boxW - W * 0.05;
  const boxY = railMid - boxH / 2;
  const midY = boxY + boxH / 2;
  const ptr = W * 0.06;
  const ptrPath = `M ${boxX},${midY - ptr} L ${boxX},${midY + ptr} L ${boxX - ptr},${midY} Z`;

  return (
    <HudSvg viewBoxW={W} viewBoxH={H}>
      <PanelChrome w={W} h={H} />

      {/* Header label */}
      <text
        x={W / 2}
        y={H * 0.09}
        fill={HUD_COLORS.label}
        fontSize={H * 0.075}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing={1}
      >
        {label}
      </text>

      {/* Tick rail */}
      <line x1={railX} y1={railTop} x2={railX} y2={railBottom} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      {ticks.map((t, i) => {
        const len = t.isMajor ? W * 0.12 : W * 0.06;
        const color = t.isMajor ? HUD_COLORS.majorTick : HUD_COLORS.minorTick;
        return (
          <g key={i}>
            <line x1={railX} y1={t.y} x2={railX + len} y2={t.y} stroke={color} strokeWidth={1} />
            {t.isMajor && (
              <text
                x={railX - W * 0.05}
                y={t.y}
                fill="rgba(255,255,255,0.65)"
                fontSize={H * 0.06}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {t.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Readout box */}
      <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={4} ry={4} fill="rgba(0,0,0,0.72)" />
      <rect x={boxX} y={boxY} width={Math.max(2, W * 0.025)} height={boxH} fill={accent} />
      <path d={ptrPath} fill="rgba(255,255,255,0.32)" />

      <text
        x={boxX + boxW / 2}
        y={midY - boxH * 0.08}
        fill={HUD_COLORS.white}
        fontSize={H * 0.16}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {Math.round(value)}
      </text>
      <text
        x={boxX + boxW / 2}
        y={midY + boxH * 0.30}
        fill={HUD_COLORS.label}
        fontSize={H * 0.07}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing={1}
      >
        {unit}
      </text>
    </HudSvg>
  );
}
