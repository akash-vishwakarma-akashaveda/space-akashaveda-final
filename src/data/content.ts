// Simulated console data (fleet, pass schedule, conjunction events). Figures are illustrative.
// Page copy lives in site.ts (English and Hindi) and products.ts / products.hi.ts.

/** Resolutions section (deck, nav link, rail status). Hidden for now; its chapter's scroll space stays as the satellite close-up. */
export const SHOW_RESOLUTIONS = false;

export const FLEET = [
  { id: 'SAT-01', plane: 'P1', st: 'IN CONTACT', c: 'var(--ok)' },
  { id: 'SAT-02', plane: 'P1', st: 'PASS 02:14', c: 'var(--mute)' },
  { id: 'SAT-03', plane: 'P1', st: 'NOMINAL', c: 'var(--accT)' },
  { id: 'SAT-04', plane: 'P2', st: 'THERMAL WATCH', c: 'var(--warn)' },
  { id: 'SAT-05', plane: 'P2', st: 'NOMINAL', c: 'var(--accT)' },
  { id: 'SAT-06', plane: 'P2', st: 'PASS 05:40', c: 'var(--mute)' },
];

export const PASSES = [
  { sat: 'SAT-01', w: [{ l: '8%', w: '6%', c: 'var(--acc)' }, { l: '58%', w: '5%', c: 'var(--acc)' }] },
  { sat: 'SAT-02', w: [{ l: '24%', w: '7%', c: 'var(--tc)' }, { l: '76%', w: '6%', c: 'var(--tc)' }] },
  { sat: 'PARTNER', w: [{ l: '40%', w: '8%', c: 'var(--line2)' }] },
];

export interface ConjunctionOption {
  id: string;
  t: string;
  dv: string;
  newMiss: string;
  newPc: string;
  prop: string;
  gw: string;
  rec?: boolean;
}

export interface ConjunctionEvent {
  id: string;
  primary: string;
  obj: string;
  norad: string;
  type: string;
  miss: string;
  dr: string;
  dt: string;
  dn: string;
  vrel: string;
  pc: string;
  risk: string;
  c: string;
  tca: string;
  tcaRel: string;
  sig: string;
  hbr: string;
  rx: number;
  ry: number;
  x: number;
  y: number;
  alt: string;
  options: ConjunctionOption[];
}

export const EVENTS: ConjunctionEvent[] = [
  {
    id: 'CDM-2031',
    primary: 'SAT-01 (NORAD 59281)',
    obj: 'DEB-31448 · FENGYUN-1C DEB',
    norad: 'NORAD 31448',
    type: 'Debris fragment',
    miss: '186.4 m',
    dr: '+38.2 m',
    dt: '-142.6 m',
    dn: '+114.8 m',
    vrel: '14.62 km/s',
    pc: '2.41e-4',
    risk: 'IMMEDIATE ACTION',
    c: 'var(--risk)',
    tca: '2026-10-01 14:48:22 UTC (T+06:42:10)',
    tcaRel: 'T+06:42:10',
    sig: 'σ_R ±14 m · σ_T ±86 m',
    hbr: '2.50 m',
    rx: 70,
    ry: 26,
    x: 146,
    y: 78,
    alt: '564.2 km (SSO)',
    options: [
      {
        id: 'OPT-A',
        t: 'Option A · Prograde burn (Δv 0.124 m/s)',
        dv: '+0.124 m/s',
        newMiss: '2.14 km',
        newPc: '< 1.0e-7',
        prop: '42.6 g N2H4 (0.18% margin)',
        gw: 'GS-01 · Next contact AOS 12:44 UTC',
        rec: true,
      },
      {
        id: 'OPT-B',
        t: 'Option B · Radial trim (Δv 0.082 m/s)',
        dv: '+0.082 m/s',
        newMiss: '1.48 km',
        newPc: '8.2e-7',
        prop: '28.1 g N2H4',
        gw: 'GS-01 · Next contact AOS 12:44 UTC',
        rec: false,
      },
      {
        id: 'OPT-C',
        t: 'Option C · Passive track · Re-screen in 6 h',
        dv: '0.000 m/s',
        newMiss: '186.4 m (unmitigated)',
        newPc: '2.41e-4',
        prop: '0.0 g',
        gw: 'Awaits SSN radar pass #4 at 11:15 UTC',
        rec: false,
      },
    ],
  },
  {
    id: 'CDM-2033',
    primary: 'SAT-04 (NORAD 59284)',
    obj: 'R/B-39087 · CZ-4B SPENT STAGE',
    norad: 'NORAD 39087',
    type: 'Rocket body',
    miss: '742.0 m',
    dr: '+124.0 m',
    dt: '-610.5 m',
    dn: '+402.0 m',
    vrel: '11.84 km/s',
    pc: '4.20e-5',
    risk: 'MONITOR',
    c: 'var(--warn)',
    tca: '2026-10-02 03:11:56 UTC (T+19:05:44)',
    tcaRel: 'T+19:05:44',
    sig: 'σ_R ±32 m · σ_T ±195 m',
    hbr: '4.20 m',
    rx: 84,
    ry: 34,
    x: 176,
    y: 58,
    alt: '571.8 km (SSO)',
    options: [
      {
        id: 'OPT-A',
        t: 'Option A · Maintain tracking watch',
        dv: '0.000 m/s',
        newMiss: '742.0 m (monitoring threshold)',
        newPc: '4.2e-5',
        prop: '0.0 g',
        gw: 'Auto-rescreen on CDM update #3',
        rec: true,
      },
      {
        id: 'OPT-B',
        t: 'Option B · Phasing adjustment (Δv 0.054 m/s)',
        dv: '+0.054 m/s',
        newMiss: '3.60 km',
        newPc: '< 1.0e-7',
        prop: '18.4 g N2H4',
        gw: 'GS-01 · Contact pass 05',
        rec: false,
      },
    ],
  },
  {
    id: 'CDM-2032',
    primary: 'SAT-02 (NORAD 59282)',
    obj: 'SAT-27711 · IRIDIUM-33 DERIVATIVE',
    norad: 'NORAD 27711',
    type: 'Defunct spacecraft',
    miss: '1.42 km',
    dr: '+310.0 m',
    dt: '+1,120 m',
    dn: '-780.0 m',
    vrel: '9.45 km/s',
    pc: '3.12e-6',
    risk: 'ADVISORY',
    c: 'var(--ok)',
    tca: '2026-10-02 15:18:15 UTC (T+31:12:03)',
    tcaRel: 'T+31:12:03',
    sig: 'σ_R ±48 m · σ_T ±310 m',
    hbr: '3.00 m',
    rx: 96,
    ry: 40,
    x: 212,
    y: 40,
    alt: '558.0 km (SSO)',
    options: [
      {
        id: 'OPT-A',
        t: 'Option A · No maneuver required (Pc < 1e-5 threshold)',
        dv: '0.000 m/s',
        newMiss: '1.42 km (nominal clearance)',
        newPc: '3.12e-6',
        prop: '0.0 g',
        gw: 'Routine tracking logging',
        rec: true,
      },
    ],
  },
];
