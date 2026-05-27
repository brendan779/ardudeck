/**
 * Catalog of widgets that appear on the FPV canvas. Each entry has its own
 * inline renderer that pulls from the telemetry store and renders a
 * Skyline-style widget directly — independent of the original ArduDeck
 * panel components in `../panels/` (which were restored to upstream so
 * Dockview layouts look like stock ArduDeck).
 *
 * Default positions assume a 1280 × 720 canvas baseline; see the screenshot
 * the user shared for the target placement.
 */
import { useTelemetryStore } from '../../stores/telemetry-store';
import { useMessagesStore } from '../../stores/messages-store';
import { GPS_FIX_TYPES } from '../../../shared/telemetry-types';
import type { FpvWidgetPlacement } from '../../../shared/ipc-channels';

import { ArtificialHorizon } from '../widgets/ArtificialHorizon';
import { Tape } from '../widgets/Tape';
import { BatteryGauge } from '../widgets/BatteryGauge';
import { ModePill } from '../widgets/ModePill';
import { GpsCard } from '../widgets/GpsCard';
import { MessagesList } from '../widgets/MessagesList';
import { HeadingCompass } from '../widgets/HeadingCompass';
import { SpeedDualReadout } from '../widgets/SpeedDualReadout';
import { SkylineMap } from '../widgets/SkylineMap';

export interface FpvWidgetSpec {
  id: string;
  title: string;
  /** Renderer — receives no props, pulls its data from the telemetry store. */
  render: () => JSX.Element;
  /** Default placement when the widget is first added or layout is reset. */
  defaultPlacement: FpvWidgetPlacement;
}

// ---- Inline renderer components ---------------------------------------------
// Each one is a thin wrapper that pulls only what its widget needs from the
// telemetry store, so unrelated telemetry updates don't re-render it.

function AttitudeRenderer() {
  const roll = useTelemetryStore((s) => s.attitude.roll);
  const pitch = useTelemetryStore((s) => s.attitude.pitch);
  return <ArtificialHorizon roll={roll} pitch={pitch} />;
}

function AltitudeRenderer() {
  const alt = useTelemetryStore((s) => s.vfrHud.alt);
  return <Tape label="ALT" unit="m" value={alt} />;
}

function SpeedTapeRenderer() {
  const gs = useTelemetryStore((s) => s.vfrHud.groundspeed);
  return <Tape label="SPD" unit="m/s" value={gs} />;
}

function BatteryRenderer() {
  const voltage = useTelemetryStore((s) => s.battery.voltage);
  const current = useTelemetryStore((s) => s.battery.current);
  const remaining = useTelemetryStore((s) => s.battery.remaining);
  const unknown = remaining < 0;
  return (
    <BatteryGauge
      voltage={voltage}
      current={current}
      remainingPct={unknown ? null : Math.max(0, Math.min(100, remaining))}
      hasData={!unknown}
    />
  );
}

function ModeRenderer() {
  const mode = useTelemetryStore((s) => s.flight.mode);
  const armed = useTelemetryStore((s) => s.flight.armed);
  return <ModePill mode={mode} armed={armed} />;
}

function GpsRenderer() {
  const gps = useTelemetryStore((s) => s.gps);
  return (
    <GpsCard
      fixType={gps.fixType}
      fixLabel={GPS_FIX_TYPES[gps.fixType] || 'No GPS'}
      satellites={gps.satellites}
      hdop={gps.hdop}
      altitude={gps.alt}
    />
  );
}

function MessagesRenderer() {
  const messages = useMessagesStore((s) => s.messages);
  return <MessagesList messages={messages} />;
}

function CompassRenderer() {
  const heading = useTelemetryStore((s) => s.vfrHud.heading);
  return <HeadingCompass heading={heading} />;
}

function VelocityRenderer() {
  // Renamed semantically from "velocity" (N/E/D vector) to dual speed
  // readout — gnd + air speed are what a pilot wants visible during flight.
  const gs = useTelemetryStore((s) => s.vfrHud.groundspeed);
  const as = useTelemetryStore((s) => s.vfrHud.airspeed);
  return <SpeedDualReadout groundSpeed={gs} airSpeed={as} />;
}

function MapRenderer() {
  return <SkylineMap />;
}

// ---- Catalog (default positions match the user's reference screenshot) ------

export const FPV_WIDGETS: FpvWidgetSpec[] = [
  {
    id: 'gps',
    title: 'GPS',
    render: () => <GpsRenderer />,
    defaultPlacement: { x: 20, y: 20, w: 200, h: 110, visible: true },
  },
  {
    id: 'battery',
    title: 'Battery',
    render: () => <BatteryRenderer />,
    defaultPlacement: { x: 1010, y: 20, w: 250, h: 110, visible: true },
  },
  {
    id: 'compass',
    title: 'Heading',
    render: () => <CompassRenderer />,
    defaultPlacement: { x: 430, y: 20, w: 420, h: 70, visible: true },
  },
  {
    id: 'altitude',
    title: 'Altitude',
    render: () => <AltitudeRenderer />,
    defaultPlacement: { x: 20, y: 480, w: 100, h: 220, visible: true },
  },
  {
    id: 'speed',
    title: 'Speed Tape',
    render: () => <SpeedTapeRenderer />,
    defaultPlacement: { x: 130, y: 480, w: 100, h: 220, visible: true },
  },
  {
    id: 'velocity',
    title: 'Speed (Gnd/Air)',
    render: () => <VelocityRenderer />,
    defaultPlacement: { x: 290, y: 540, w: 260, h: 110, visible: true },
  },
  {
    id: 'attitude',
    title: 'Attitude',
    render: () => <AttitudeRenderer />,
    defaultPlacement: { x: 580, y: 530, w: 160, h: 160, visible: true },
  },
  {
    id: 'mode',
    title: 'Mode',
    render: () => <ModeRenderer />,
    defaultPlacement: { x: 1080, y: 550, w: 180, h: 70, visible: true },
  },
  {
    id: 'messages',
    title: 'Messages',
    render: () => <MessagesRenderer />,
    defaultPlacement: { x: 760, y: 540, w: 300, h: 170, visible: true },
  },
  {
    id: 'map',
    title: 'Map',
    render: () => <MapRenderer />,
    defaultPlacement: { x: 1020, y: 150, w: 240, h: 220, visible: false },
  },
];

export function getDefaultFpvLayout(): Record<string, FpvWidgetPlacement> {
  const out: Record<string, FpvWidgetPlacement> = {};
  for (const w of FPV_WIDGETS) out[w.id] = { ...w.defaultPlacement };
  return out;
}
