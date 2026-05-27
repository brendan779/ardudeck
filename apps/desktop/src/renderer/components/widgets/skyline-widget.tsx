/**
 * Shared primitives for the Skyline-style HUD widgets that ArduDeck's panels
 * use. Mirrors Skyline/Render/Widgets/WidgetSupport.swift — same fonts,
 * panel chrome, and color palette so the FPV layout feels like Skyline.
 *
 * Widgets render as a single responsive `<svg viewBox="0 0 W H" preserveAspectRatio="xMidYMid meet">`
 * that fills its parent. All coordinates inside the SVG are expressed
 * relative to the reference W/H constants below (`REF_W`, `REF_H`), so the
 * design scales cleanly with the dockview panel size.
 */
import type { ReactNode } from 'react';

/** Reference design width in viewBox units. Choose 200 for square widgets;
 *  rectangular widgets use REF_W × REF_H for their aspect. */
export const REF_W = 200;
export const REF_H = 200;

/** Skyline HUD palette — sourced from Skyline/Render/Widgets/*.swift. */
export const HUD_COLORS = {
  /** Default translucent panel fill — readable over any video. */
  panel: 'rgba(10, 10, 14, 0.55)',
  /** Hairline panel border. */
  panelStroke: 'rgba(255, 255, 255, 0.22)',
  /** Section / unit labels (the dim sub-text). */
  label: 'rgba(255, 255, 255, 0.65)',
  /** Major / minor tick lines. */
  majorTick: 'rgba(255, 255, 255, 0.6)',
  minorTick: 'rgba(255, 255, 255, 0.32)',
  /** Default accent (Skyline's "amber-ish" — also used for active value edges). */
  accent: '#f5a524',
  /** Battery zones. */
  good: '#4dcb61',
  warn: '#f3c739',
  bad: '#eb4d3d',
  /** Artificial horizon sky / ground at 88% alpha. */
  sky: 'rgba(45, 100, 165, 0.88)',
  ground: 'rgba(95, 62, 22, 0.88)',
  white: '#ffffff',
} as const;

/**
 * SVG panel chrome — rounded rect background + hairline border. Drop in at
 * the top of every widget SVG so they look consistent.
 */
export function PanelChrome({ w, h, fill = HUD_COLORS.panel }: { w: number; h: number; fill?: string }) {
  const r = h * 0.12;
  return (
    <>
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={r} ry={r} fill={fill} />
      <rect
        x={0.5}
        y={0.5}
        width={w - 1}
        height={h - 1}
        rx={r}
        ry={r}
        fill="none"
        stroke={HUD_COLORS.panelStroke}
        strokeWidth={1}
      />
    </>
  );
}

/**
 * Responsive widget wrapper. Renders an SVG with `xMidYMid meet` so the
 * design scales but never distorts, fills the parent panel completely, and
 * applies the HUD font so any `<text>` children inherit Barlow Condensed.
 *
 * Pass the design viewBox dimensions you authored to.
 */
export function HudSvg({
  viewBoxW,
  viewBoxH,
  children,
  className = '',
}: {
  viewBoxW: number;
  viewBoxH: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={`block w-full h-full ${className}`}
      viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: "'Barlow Condensed', 'Inter', system-ui, sans-serif" }}
    >
      {children}
    </svg>
  );
}

/**
 * Standard host for a panel — fills the dockview cell, no padding (widgets
 * own their margins via their SVG viewBox). Centers content vertically when
 * a widget renders smaller than the cell.
 */
export function SkylinePanelHost({ children }: { children: ReactNode }) {
  return <div className="h-full w-full p-1.5">{children}</div>;
}
