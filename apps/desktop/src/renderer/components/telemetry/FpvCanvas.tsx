/**
 * FPV canvas — replaces Dockview when the FPV preset layout is active.
 * Free-form draggable widgets over the FpvVideoBackground, Skyline-style.
 *
 * Widgets live in a fixed-size "design space" (DESIGN_W × DESIGN_H, matching
 * a standard 16:9 FPV stream). The whole widget layer is CSS-scaled to fit
 * the container, preserving aspect and centering. That means the same layout
 * looks identical at any container size — a small windowed view is the same
 * scene as fullscreen, just zoomed out. Per-widget x/y/w/h are stored in
 * design-space units.
 *
 * Per-widget placement persists via the settings store (`fpvLayout`).
 * Edit / Lock toggle gates dragging and shows the grid background. Reset
 * clears placements back to catalog defaults.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { FpvVideoBackground } from './FpvVideoBackground';
import { DraggableFpvWidget } from './DraggableFpvWidget';
import { FPV_WIDGETS, getDefaultFpvLayout } from './fpv-widgets-catalog';

/** Design-space dimensions. All widget placements use these units. */
const DESIGN_W = 1280;
const DESIGN_H = 720;

export function FpvCanvas() {
  const fpvLayout = useSettingsStore((s) => s.fpvLayout);
  const setPlacement = useSettingsStore((s) => s.setFpvWidgetPlacement);
  const resetLayout = useSettingsStore((s) => s.resetFpvLayout);

  const [editMode, setEditMode] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: DESIGN_W, h: DESIGN_H });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch (err) {
      console.warn('[FpvCanvas] fullscreen toggle failed:', err);
    }
  }

  // Fit the design space inside the container, preserving aspect (letterbox
  // if needed). Centered with translate so the canvas is always inside.
  const { scale, offsetX, offsetY } = useMemo(() => {
    const sx = containerSize.w / DESIGN_W;
    const sy = containerSize.h / DESIGN_H;
    const s = Math.min(sx, sy);
    return {
      scale: s,
      offsetX: (containerSize.w - DESIGN_W * s) / 2,
      offsetY: (containerSize.h - DESIGN_H * s) / 2,
    };
  }, [containerSize]);

  // Resolve effective placement: stored value, else catalog default.
  const defaults = getDefaultFpvLayout();
  const placements = FPV_WIDGETS.map((spec) => ({
    spec,
    placement: fpvLayout.widgets[spec.id] ?? defaults[spec.id]!,
  }));

  const visible = placements.filter((p) => p.placement.visible);
  const hidden = placements.filter((p) => !p.placement.visible);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
      <FpvVideoBackground />

      {/* Design-space widget layer — sized to DESIGN_W × DESIGN_H, then
          CSS-scaled to fit the container. All widget coordinates inside this
          layer are in design pixels, so a layout authored at one resolution
          looks identical at any other. */}
      <div
        className="absolute"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transformOrigin: 'top left',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        }}
      >
        {/* Grid background — only visible in edit mode. 10-design-px cells
            match the DraggableFpvWidget snap step exactly. */}
        {editMode && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), ' +
                'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />
        )}

        {visible.map(({ spec, placement }) => (
          <DraggableFpvWidget
            key={spec.id}
            id={spec.id}
            title={spec.title}
            placement={placement}
            editMode={editMode}
            canvasW={DESIGN_W}
            canvasH={DESIGN_H}
            scale={scale}
            onChange={(updates) => setPlacement(spec.id, updates)}
            onHide={() => setPlacement(spec.id, { visible: false })}
          >
            {spec.render()}
          </DraggableFpvWidget>
        ))}
      </div>

      {/* Toolbar — top-right, in container space (NOT scaled) so buttons are
          always the same readable size regardless of canvas zoom. */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 font-hud">
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1 text-xs rounded uppercase tracking-widest text-white"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.22)' }}
          title="Fullscreen (Esc to exit)"
        >
          {isFullscreen ? 'Exit FS' : 'Fullscreen'}
        </button>
        <button
          onClick={() => setEditMode((v) => !v)}
          className="px-3 py-1 text-xs rounded uppercase tracking-widest text-white"
          style={{
            background: editMode ? 'rgba(245,165,36,0.85)' : 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.22)',
          }}
        >
          {editMode ? 'Lock' : 'Edit'}
        </button>
        {editMode && (
          <>
            <div className="relative">
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                className="px-3 py-1 text-xs rounded uppercase tracking-widest text-white"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.22)' }}
              >
                + Widget
              </button>
              {showAddMenu && (
                <div
                  className="absolute right-0 mt-1 w-40 rounded shadow-lg overflow-hidden"
                  style={{ background: 'rgba(10,10,14,0.95)', border: '1px solid rgba(255,255,255,0.22)' }}
                >
                  {hidden.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-white/50">All widgets visible</div>
                  ) : (
                    hidden.map(({ spec }) => (
                      <button
                        key={spec.id}
                        onClick={() => {
                          setPlacement(spec.id, { ...spec.defaultPlacement, visible: true });
                          setShowAddMenu(false);
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-white hover:bg-white/10"
                      >
                        {spec.title}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (confirm('Reset all FPV widget positions to defaults?')) resetLayout();
              }}
              className="px-3 py-1 text-xs rounded uppercase tracking-widest text-white"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
