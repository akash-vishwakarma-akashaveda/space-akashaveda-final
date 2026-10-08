import type { ReactNode } from 'react';
import { EVENTS, FLEET, PASSES } from '../data/content';
import { antennaPointing, ebn0, getSubsystemTelemetry, losClock, tmCharts } from '../data/sim';

const warn = 'var(--warn)';
const AGENTS = [
  { k: 'A1', t: 'Payload Planner' },
  { k: 'A2', t: 'Orbit Agent' },
  { k: 'A3', t: 'Telemetry Analyser' },
  { k: 'A4', t: 'Simulation Agent' },
  { k: 'A5', t: 'Command Control' },
];

function Header({ dot = 'var(--acc)', title, children }: { dot?: string; title: string; children?: ReactNode }) {
  return (
    <div className="dash-head">
      <span className="dash-dot" style={{ background: dot, boxShadow: `0 0 10px ${dot}` }} />
      <span className="dash-title">{title}</span>
      {children}
    </div>
  );
}

export function PassSchedule({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {PASSES.map((p) => (
        <div key={p.sat} style={{ display: 'grid', gridTemplateColumns: compact ? '64px 1fr' : '78px 1fr', gap: compact ? 8 : 10, alignItems: 'center' }}>
          <span style={{ color: compact ? undefined : 'var(--ink2)' }}>{p.sat}</span>
          <div style={{ position: 'relative', height: compact ? 8 : 14, borderRadius: compact ? 4 : 0, background: compact ? 'rgba(247, 243, 234,.08)' : 'var(--line)' }}>
            {p.w.map((w) => (
              <span key={w.l} style={{ position: 'absolute', top: 0, bottom: 0, left: w.l, width: w.w, background: w.c, borderRadius: compact ? 4 : 0 }} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── GS-01 antenna control ──────────────────────────────────── */

export function GSConsole({ p, chapter, tick }: { p: number; chapter: number; tick: number }) {
  const { az, el } = antennaPointing(p);
  const step = Math.max(0, chapter - 3);
  const stats = [
    { k: 'AZIMUTH', v: az.toFixed(1) + '°', c: 'var(--ink)' },
    { k: 'ELEVATION', v: el.toFixed(1) + '°', c: 'var(--ink)' },
    { k: 'MODE', v: 'AUTOTRACK', c: 'var(--accT)' },
    { k: 'TM ↓ RX', v: 'LOCKED', c: 'var(--tm)' },
    { k: 'TC ↑ TX', v: step >= 2 ? 'ACTIVE' : 'STANDBY', c: 'var(--tc)' },
    { k: 'EB/N0', v: ebn0(tick), c: 'var(--ink)' },
  ];
  // The GS-01 signal chain, antenna to customer.
  const chain = [
    { n: '01', t: 'Antenna · 7.5 m S / X / Ka', st: 'TRACKING', c: 'var(--ok)' },
    { n: '02', t: 'RF chain', st: 'LOCKED', c: 'var(--ok)' },
    { n: '03', t: 'Baseband', st: 'FRAME SYNC', c: 'var(--ok)' },
    { n: '04', t: 'Secure network', st: 'ENCRYPTED', c: 'var(--ok)' },
    { n: '05', t: 'Station control', st: 'AUTO-SCHEDULED', c: 'var(--accT)' },
    { n: '06', t: 'Customer · edge ingestion', st: step >= 3 ? 'DELIVERED' : 'STREAMING', c: step >= 3 ? 'var(--ok)' : 'var(--accT)' },
  ];
  return (
    <>
      <Header title="GS-01 · Ground station">
        <span style={{ marginLeft: 'auto', color: 'var(--mute)' }}>7.5 m · S / X / Ka · AUTOTRACK</span>
      </Header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--line)' }}>
        {stats.map((g) => (
          <div key={g.k} className="dash-cell" style={{ gap: 6 }}>
            <span className="dash-label">{g.k}</span>
            <span style={{ fontSize: 18, color: g.c }}>{g.v}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="dash-label">SERVICE CHAIN</span>
        {chain.map((s) => (
          <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ color: 'var(--accT)' }}>{s.n}</span>
            <span>{s.t}</span>
            <span style={{ padding: '3px 7px', border: `1px solid ${s.c}`, color: s.c, fontSize: 10.5 }}>{s.st}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 14px 16px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="dash-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>PASS SCHEDULE · NEXT 12 H</span>
          <span>00 · 03 · 06 · 09 · 12</span>
        </div>
        <PassSchedule />
      </div>
    </>
  );
}

/* ─── Vyuh MCS ───────────────────────────────────────────────── */

export interface ConsoleState {
  fleetSel: number;
  approved: boolean;
  sent: boolean;
  sel: number;
}

export function TelemetryCharts({ tick, satIndex = 0, compact = false }: { tick: number; satIndex?: number; compact?: boolean }) {
  return (
    <>
      {tmCharts(tick, satIndex).map((c) => (
        <div key={c.k} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 3 : 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, whiteSpace: compact ? 'nowrap' : undefined }}>
            <span style={{ color: compact ? 'var(--mute)' : undefined, fontSize: compact ? 10.5 : 11 }}>{c.k}</span>
            <span style={{ color: c.col, fontSize: compact ? 11 : 12 }}>{c.v}</span>
          </div>
          <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{ width: '100%', height: compact ? 26 : 38, display: 'block', background: compact ? undefined : 'var(--line)' }} aria-hidden="true">
            <polyline points={c.pts} fill="none" stroke={c.col} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </svg>
          {!compact && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '.06em', color: 'var(--mute)' }}>
              <span>{c.unit}</span>
              <span>LIMITS {c.lim}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function VyuhConsole({ p, tick, s, onSelectSat, onApprove }: { p: number; tick: number; s: ConsoleState; onSelectSat: (i: number) => void; onApprove: () => void }) {
  const { approved, sent, fleetSel } = s;
  const currentSat = FLEET[fleetSel];
  const sub = getSubsystemTelemetry(fleetSel, tick);

  const cmds = [
    ...(sent ? [{
      id: 'TC-0419',
      name: 'ADCS_EXEC_MANOEUVRE(BURN_ID=MNV-2031-A, Δv=+0.124 m/s, TIG=14:22:00 UTC)',
      meta: 'SRC: CHAKRA CDM-2031 · PROTOCOL: CCSDS 232.0-B · AWAITING DUAL AUTH',
      st: 'PENDING 0/2',
      sc: warn,
      bd: 'var(--acc)',
      canApprove: false,
    }] : []),
    {
      id: 'TC-0412',
      name: 'PAYLOAD_ACQ_CONFIG(MODE=MULTI_SPECTRAL, SSR_TARGET=0x04)',
      meta: approved ? 'OPERATOR_A [✓] · FLIGHT_DIR_B [✓] · RELEASED TO GS-01' : 'OPERATOR_A [✓] · FLIGHT_DIR_B PENDING',
      st: approved ? 'RELEASED' : 'PENDING 1/2',
      sc: approved ? 'var(--ok)' : warn,
      bd: approved ? 'var(--line2)' : 'var(--acc)',
      canApprove: !approved,
    },
    {
      id: 'TC-0411',
      name: 'SSR_PLAYBACK_DOWNLINK(START_BLK=0x011A, CNT=4096, PRIORITY=HIGH)',
      meta: 'OPERATOR_A [✓] · FLIGHT_DIR_B [✓] · EXECUTION ACKNOWLEDGED',
      st: 'EXECUTED',
      sc: 'var(--ok)',
      bd: 'var(--line2)',
      canApprove: false,
    },
  ];

  const audit = [
    ...(sent ? [{ t: '14:02:44 UTC', m: 'Chakra: CDM-2031 Option A (Δv +0.124 m/s) verified by Flight Dynamics, queued into Vyuh' }] : []),
    ...(approved ? [{ t: '14:02:18 UTC', m: 'TC-0412 cryptographic uplink token dual-authorized by FLIGHT_DIR_B, released to GS-01 terminal' }] : []),
    { t: '14:02:04 UTC', m: 'TC-0412 pre-authorized by OPERATOR_A (Payload Operations)' },
    { t: '14:01:22 UTC', m: 'TC-0411 executed: SSR playback confirmed over X-band downlink (1.28 GB ingested)' },
    { t: '14:00:00 UTC', m: 'AOS at GS-01 · S-band TT&C autotrack locked at El: 14.8°, Az: 218.4° (Eb/N0: 13.8 dB)' },
  ].slice(0, 4);

  return (
    <>
      <Header title="Vyuh · Mission control">
        <span style={{ color: 'var(--mute)' }}>{currentSat.id} · PASS 0412 · GS-01</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: fleetSel === 0 ? 'var(--ok)' : 'var(--mute)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: fleetSel === 0 ? 'var(--ok)' : 'var(--mute)' }} />
          {fleetSel === 0 ? `IN CONTACT · LOS ${losClock(p, tick)}` : `${currentSat.st}`}
        </span>
      </Header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 1, background: 'var(--line)', borderBottom: '1px solid var(--line)' }}>
        {FLEET.map((f, i) => (
          <button
            key={f.id}
            onClick={() => onSelectSat(i)}
            aria-pressed={i === fleetSel}
            className="mono"
            style={{ background: i === fleetSel ? 'var(--line2)' : 'var(--dash)', border: 0, padding: '10px 12px', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 5 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
              <span style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: f.c }} />
              {f.id}
              <span style={{ marginLeft: 'auto', color: 'var(--mute)' }}>{f.plane}</span>
            </span>
            <span style={{ color: f.c, fontSize: 10.5 }}>{f.st}</span>
          </button>
        ))}
      </div>

      {/* The five Vyuh agents */}
      <div className="dash-agents">
        {AGENTS.map((a) => (
          <span key={a.k}>
            <span className="dash-label">{a.k}</span>
            {a.t}
          </span>
        ))}
      </div>

      {/* Subsystem Telemetry Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 1, background: 'var(--line)', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
        <div style={{ padding: '8px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="dash-label" style={{ color: 'var(--tm)' }}>EPS / POWER</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>BUS_V</span><span style={{ color: 'var(--ink)' }}>{sub.eps.busV}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>BUS_I / SOC</span><span style={{ color: 'var(--ink)' }}>{sub.eps.busI} · {sub.eps.soc}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>SOLAR_GEN</span><span style={{ color: 'var(--ink)' }}>{sub.eps.solarPwr}</span></div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="dash-label" style={{ color: 'var(--accT)' }}>ADCS / ATTITUDE</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>MODE</span><span style={{ color: 'var(--ink)' }}>{sub.adcs.mode}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>POINT_ERR</span><span style={{ color: 'var(--ink)' }}>{sub.adcs.err}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>RW_MAX</span><span style={{ color: 'var(--ink)' }}>{sub.adcs.rwMax}</span></div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="dash-label" style={{ color: 'var(--ok)' }}>RF / TT&C LINK</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>CARRIER</span><span style={{ color: fleetSel === 0 ? 'var(--ok)' : 'var(--mute)' }}>{sub.rf.carrier}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>DOPPLER</span><span style={{ color: 'var(--ink)' }}>{sub.rf.doppler}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>RSSI / EB_N0</span><span style={{ color: 'var(--ink)' }}>{sub.rf.rssi}</span></div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="dash-label" style={{ color: sub.obdh.tempWarn ? 'var(--warn)' : 'var(--tc)' }}>OBDH / THERMAL</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>OBC_TEMP</span><span style={{ color: sub.obdh.tempWarn ? 'var(--warn)' : 'var(--ink)', fontWeight: sub.obdh.tempWarn ? 600 : 400 }}>{sub.obdh.obcTemp}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>BATT_TEMP</span><span style={{ color: 'var(--ink)' }}>{sub.obdh.battTemp}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink2)' }}><span>SSR / STATUS</span><span style={{ color: sub.obdh.tempWarn ? 'var(--warn)' : 'var(--ink)' }}>{sub.obdh.status}</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 1, background: 'var(--line)' }}>
        <div className="dash-cell" style={{ gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dash-label">REAL-TIME TELEMETRY STREAM</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>CCSDS PACKET SYNC</span>
          </div>
          <TelemetryCharts tick={tick} satIndex={fleetSel} />
        </div>
        <div className="dash-cell" style={{ gap: 10 }}>
          <span className="dash-label">COMMAND QUEUE · DUAL AUTHORISATION</span>
          {cmds.map((c) => (
            <div key={c.id} style={{ padding: 10, border: `1px solid ${c.bd}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{c.id}</span>
                <span style={{ color: c.sc, fontSize: 11 }}>{c.st}</span>
              </div>
              <span style={{ color: 'var(--ink2)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{c.name}</span>
              <span className="dash-label" style={{ fontSize: 10 }}>{c.meta}</span>
              {c.canApprove && (
                <button onClick={onApprove} className="dash-btn">
                  APPROVE AS OPERATOR B →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span className="dash-label">MISSION AUDIT TRAIL</span>
        {audit.map((a) => (
          <div key={a.t} style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: 10, color: 'var(--ink2)', fontSize: 11.5 }}>
            <span style={{ color: 'var(--mute)', fontFamily: "'JetBrains Mono',monospace" }}>{a.t}</span>
            <span>{a.m}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Chakra SSA ─────────────────────────────────────────────── */

const EVENT_COLS = '78px minmax(0,1.2fr) 78px 84px 72px 100px';

export function ChakraConsole({ s, onSelectEvent, onSend }: { s: ConsoleState; onSelectEvent: (i: number) => void; onSend: () => void }) {
  const e = EVENTS[s.sel];
  return (
    <>
      <Header dot="var(--risk)" title="Chakra · Conjunction screening">
        <span style={{ marginLeft: 'auto', color: 'var(--mute)' }}>SOCAP · SOCAA · ACOLA</span>
      </Header>
      <div className="dash-label" style={{ display: 'grid', gridTemplateColumns: EVENT_COLS, gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--line)', minWidth: 0, fontSize: 10.5 }}>
        <span>EVENT</span><span>TARGET PAIR</span><span>MISS</span><span>V_REL</span><span>MAX PC</span><span>RISK LEVEL</span>
      </div>
      {EVENTS.map((ev, i) => (
        <button
          key={ev.id}
          onClick={() => onSelectEvent(i)}
          aria-pressed={i === s.sel}
          className="mono"
          style={{ width: '100%', display: 'grid', gridTemplateColumns: EVENT_COLS, gap: 10, padding: '10px 14px', border: 0, borderBottom: '1px solid var(--line)', background: i === s.sel ? 'var(--line)' : 'transparent', color: 'var(--ink)', cursor: 'pointer', textAlign: 'left', fontSize: 11.5 }}
        >
          <span style={{ fontWeight: 600 }}>{ev.id}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.primary} vs {ev.obj}</span>
          <span>{ev.miss}</span>
          <span>{ev.vrel}</span>
          <span>{ev.pc}</span>
          <span style={{ color: ev.c, fontWeight: 500 }}>{ev.risk}</span>
        </button>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 1, background: 'var(--line)' }}>
        <div className="dash-cell" style={{ gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dash-label">ENCOUNTER B-PLANE · {e.id}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>ALT {e.alt}</span>
          </div>
          <svg viewBox="0 0 260 180" style={{ width: '100%', height: 180, display: 'block', background: 'var(--line)' }} aria-label={`Encounter plane for ${e.id}`}>
            {/* Grid & Axis */}
            <line x1="0" y1="90" x2="260" y2="90" stroke="var(--line2)" strokeWidth={1} />
            <line x1="130" y1="0" x2="130" y2="180" stroke="var(--line2)" strokeWidth={1} />
            <text x="180" y="84" fill="var(--mute)" fontSize="9" fontFamily="'JetBrains Mono',monospace">+T (In-track)</text>
            <text x="134" y="14" fill="var(--mute)" fontSize="9" fontFamily="'JetBrains Mono',monospace">+R (Radial)</text>

            {/* 3-sigma outer covariance */}
            <ellipse cx="130" cy="90" rx={e.rx * 1.5} ry={e.ry * 1.5} fill="none" stroke="var(--risk)" strokeOpacity=".3" strokeWidth={1} transform="rotate(-24 130 90)" />
            {/* 1-sigma inner covariance */}
            <ellipse cx="130" cy="90" rx={e.rx} ry={e.ry} fill="rgba(255,77,106,.08)" stroke="var(--risk)" strokeDasharray="3 3" strokeWidth={1.5} transform="rotate(-24 130 90)" />

            {/* Miss distance vector line */}
            <line x1="130" y1="90" x2={e.x} y2={e.y} stroke="var(--risk)" strokeWidth={1} strokeDasharray="2 2" />

            {/* Primary satellite */}
            <circle cx="130" cy="90" r="4.5" fill="var(--acc)" />
            <text x="136" y="104" fill="var(--accT)" fontSize="9.5" fontFamily="'JetBrains Mono',monospace">SAT-01</text>

            {/* Secondary object */}
            <circle cx={e.x} cy={e.y} r="4" fill="var(--risk)" />
            <text x={e.x + 6} y={e.y - 4} fill="var(--risk)" fontSize="9" fontFamily="'JetBrains Mono',monospace">TCA {e.miss}</text>
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, fontSize: 11, color: 'var(--ink2)' }}>
            <div><span style={{ color: 'var(--mute)' }}>TCA: </span><span>{e.tcaRel}</span></div>
            <div><span style={{ color: 'var(--mute)' }}>V_REL: </span><span>{e.vrel}</span></div>
            <div><span style={{ color: 'var(--mute)' }}>RIC: </span><span>R:{e.dr} T:{e.dt} N:{e.dn}</span></div>
            <div><span style={{ color: 'var(--mute)' }}>COV: </span><span>{e.sig}</span></div>
          </div>
        </div>

        <div className="dash-cell" style={{ gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dash-label">AVOIDANCE MANOEUVRES · ACOLA · RE-SCREENED</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>HBR {e.hbr}</span>
          </div>
          {e.options.map((o) => (
            <div key={o.id} style={{ padding: 10, border: `1px solid ${o.rec ? 'var(--acc)' : 'var(--line2)'}`, background: o.rec ? 'rgba(201, 162, 75,.06)' : undefined, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 12 }}>{o.t}</span>
                {o.rec && <span style={{ padding: '2px 6px', background: 'var(--acc)', color: 'var(--onAcc)', fontSize: 9.5 }}>RECOMMENDED</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 4, fontSize: 10.5, color: 'var(--ink2)' }}>
                <div><span style={{ color: 'var(--mute)' }}>NEW MISS: </span><span style={{ color: 'var(--ink)' }}>{o.newMiss}</span></div>
                <div><span style={{ color: 'var(--mute)' }}>NEW Pc: </span><span style={{ color: 'var(--ok)' }}>{o.newPc}</span></div>
                <div><span style={{ color: 'var(--mute)' }}>PROP MASS: </span><span>{o.prop}</span></div>
                <div><span style={{ color: 'var(--mute)' }}>GATEWAY: </span><span>{o.gw}</span></div>
              </div>
            </div>
          ))}
          <button onClick={onSend} disabled={s.sent} className="dash-btn" style={{ marginTop: 'auto', ['--btn' as string]: s.sent ? 'var(--ok)' : 'var(--risk)' }}>
            {s.sent ? '✓ SENT TO VYUH · AWAITING OPERATOR APPROVAL' : 'ACCEPT OPTION A · SEND TO VYUH →'}
          </button>
        </div>
      </div>
    </>
  );
}
