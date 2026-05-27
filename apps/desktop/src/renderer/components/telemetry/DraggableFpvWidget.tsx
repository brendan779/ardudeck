/**
 * Free-form draggable + resizable container for a single FPV widget.
 *
 * Uses native pointer events with `setPointerCapture` so a drag continues
 * smoothly even when the cursor exits the widget. Snap-to-grid is applied
 * on commit (pointer up) to keep dragging visually smooth.
 *
 * Resize is bottom-right corner only — simplest UX, covers 90% of intent.
 * Click+drag elsewhere on the widget header moves; drag on the body in lock
 * mode passes pointer events through so widget interactions still work.
 */
import { useRef, useState, ReactNode } from 'react';
import type { FpvWidgetPlacement } from '../../../shared/ipc-channels';

const SNAP = 10; // px grid the widget snaps to on commit
const MIN_W = 100;
const MIN_H = 80;

function snap(v: number) {
  return Math.round(v / SNAP) * SNAP;
}

export interface DraggableFpvWidgetProps {
  id: string;
  title: string;
  placement: FpvWidgetPlacement;
  editMode: boolean;
  /** Bounds of the design-space canvas — drag is clamped inside. */
  canvasW: number;
  canvasH: number;
  /**
   * CSS scale factor applied to the parent design-space layer. Pointer-event
   * deltas arrive in container pixels and must be divided by this to get
   * design-space deltas (so 1 mm of mouse motion always moves the widget the
   * same number of design pixels, regardless of zoom).
   */
  scale: number;
  onChange: (updates: Partial<FpvWidgetPlacement>) => void;
  onHide: () => void;
  children: ReactNode;
}

interface DragState {
  kind: 'move' | 'resize';
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

export function DraggableFpvWidget({
  id,
  title,
  placement,
  editMode,
  canvasW,
  canvasH,
  scale,
  onChange,
  onHide,
  children,
}: DraggableFpvWidgetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [live, setLive] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const eff = live ?? placement;

  function startDrag(kind: 'move' | 'resize', e: React.PointerEvent) {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({
      kind,
      startX: e.clientX,
      startY: e.clientY,
      origX: placement.x,
      origY: placement.y,
      origW: placement.w,
      origH: placement.h,
    });
    setLive({ x: placement.x, y: placement.y, w: placement.w, h: placement.h });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    // Pointer deltas are in container pixels; divide by scale to convert to
    // design-space pixels so dragging feels right at any zoom level.
    const safeScale = scale || 1;
    const dx = (e.clientX - drag.startX) / safeScale;
    const dy = (e.clientY - drag.startY) / safeScale;
    if (drag.kind === 'move') {
      const nx = Math.max(0, Math.min(canvasW - drag.origW, drag.origX + dx));
      const ny = Math.max(0, Math.min(canvasH - drag.origH, drag.origY + dy));
      setLive({ x: nx, y: ny, w: drag.origW, h: drag.origH });
    } else {
      const nw = Math.max(MIN_W, Math.min(canvasW - drag.origX, drag.origW + dx));
      const nh = Math.max(MIN_H, Math.min(canvasH - drag.origY, drag.origH + dy));
      setLive({ x: drag.origX, y: drag.origY, w: nw, h: nh });
    }
  }

  function endDrag(e: React.PointerEvent) {
    if (!drag || !live) return;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    onChange({
      x: snap(live.x),
      y: snap(live.y),
      w: snap(live.w),
      h: snap(live.h),
    });
    setDrag(null);
    setLive(null);
  }

  return (
    <div
      ref={ref}
      data-fpv-widget-id={id}
      className="absolute"
      style={{
        left: eff.x,
        top: eff.y,
        width: eff.w,
        height: eff.h,
        // When locked, the widget is fully interactive (clicks pass to the
        // inner widget). In edit mode, dragging on the header / corner moves
        // or resizes; clicks on the body are still allowed.
        transition: drag ? 'none' : 'box-shadow 120ms',
        boxShadow: editMode ? '0 0 0 1px rgba(255,255,255,0.15)' : 'none',
      }}
    >
      {editMode && (
        <div
          className="absolute -top-6 left-0 right-0 h-6 flex items-center justify-between gap-2 text-[10px] font-hud uppercase tracking-widest text-white/80 cursor-move select-none px-1"
          style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '4px 4px 0 0' }}
          onPointerDown={(e) => startDrag('move', e)}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span>{title}</span>
          <button
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={onHide}
            className="text-white/60 hover:text-white px-1"
            title="Hide widget"
          >
            ✕
          </button>
        </div>
      )}

      <div
        className="w-full h-full"
        style={{ pointerEvents: editMode ? 'none' : 'auto' }}
      >
        {children}
      </div>

      {editMode && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{
            background:
              'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.6) 50%, transparent 50%, transparent 70%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,0.6) 80%, transparent 80%)',
          }}
          onPointerDown={(e) => startDrag('resize', e)}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      )}
    </div>
  );
}
