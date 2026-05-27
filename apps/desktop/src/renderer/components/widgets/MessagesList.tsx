/**
 * Messages widget — Skyline-style list of recent STATUSTEXT messages with
 * severity colors and a translucent panel background. Not an SVG (text-heavy
 * with scrolling) — uses HTML + the Skyline color palette.
 */
import type { StatusMessage } from '../../../shared/ipc-channels';
import { HUD_COLORS } from './skyline-widget';

function severityColor(severityLabel: string): string {
  switch (severityLabel) {
    case 'EMERGENCY':
    case 'ALERT':
    case 'CRITICAL':
    case 'ERROR':
      return HUD_COLORS.bad;
    case 'WARNING':
      return HUD_COLORS.warn;
    case 'NOTICE':
    case 'INFO':
      return HUD_COLORS.white;
    case 'DEBUG':
    default:
      return HUD_COLORS.label;
  }
}

export function MessagesList({ messages }: { messages: StatusMessage[] }) {
  return (
    <div
      className="h-full w-full rounded-[14px] border overflow-hidden flex flex-col font-hud"
      style={{ background: HUD_COLORS.panel, borderColor: HUD_COLORS.panelStroke }}
    >
      <div
        className="px-2 py-1 text-[10px] uppercase tracking-widest border-b"
        style={{ color: HUD_COLORS.label, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        Messages
      </div>
      <div className="flex-1 overflow-auto px-2 py-1 text-[12px] leading-tight space-y-0.5">
        {messages.length === 0 ? (
          <div className="text-center pt-3" style={{ color: HUD_COLORS.label }}>
            No messages
          </div>
        ) : (
          messages.slice(0, 50).map((m, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-semibold" style={{ color: severityColor(m.severityLabel), minWidth: '4ch' }}>
                {m.severityLabel.slice(0, 4)}
              </span>
              <span className="truncate" style={{ color: HUD_COLORS.white }} title={m.text}>
                {m.text}
              </span>
              {m.count > 1 && (
                <span style={{ color: HUD_COLORS.label }}>×{m.count}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
