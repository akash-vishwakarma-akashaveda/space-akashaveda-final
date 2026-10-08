// Product pages for GS, Vyuh and Chakra. Copy follows the Akashaveda solution deck; Chakra's figures are design
// targets still to be benchmarked, and are labelled that way on the page.

export type Icon = 'pin' | 'calendar' | 'bolt' | 'antenna' | 'rocket' | 'route' | 'shield' | 'compass';

export type Block =
  /** Steps in order along one line; `highlight` marks the step the section is about. */
  | { kind: 'flow'; label?: string; steps: { k?: string; t: string; d?: string }[]; highlight?: number }
  /** One headline figure over a table of facts. */
  | { kind: 'specs'; big: string; note: string; rows: [string, string][] }
  | { kind: 'features'; label?: string; items: { icon: Icon; t: string; d: string }[] }
  /** A vertical stack of layers, top to bottom. */
  | { kind: 'layers'; items: { k: string; t: string; d: string }[] }
  | { kind: 'list'; label: string; items: { k: string; t: string; d?: string }[] }
  | { kind: 'stats'; label: string; items: { v: string; k: string }[] }
  | { kind: 'note'; icon: Icon; strong: string; text: string }
  | { kind: 'callout'; icon: Icon; eyebrow: string; t: string; d: string };

export interface Section {
  eyebrow: string;
  title?: string;
  /** Two blocks side by side on wide screens. */
  split?: boolean;
  blocks: Block[];
}

export interface ProductPage {
  path: string;
  name: string;
  /** Browser tab and search result title (keep under ~60 characters). */
  seoTitle: string;
  eyebrow: string;
  title: string;
  lede: string;
  visual: 'dish' | 'sat' | 'globe';
  sections: Section[];
  /** Shown on the page and published as FAQ structured data. */
  faq: { q: string; a: string }[];
  cta: string;
}

export const PRODUCTS: ProductPage[] = [
  {
    path: '/ground-station',
    name: 'Ground station',
    seoTitle: 'GS-01 · India’s first commercial 7.5 m antenna · Akashaveda',
    eyebrow: '01 — Connect · Ground station',
    title: 'India’s first commercial 7.5 m tri-band antenna.',
    lede: 'GS-01, the first node of the Akashaveda network, is India’s first commercial 7.5 m antenna: S, X and Ka band for TT&C, payload downlink and reserved capacity.',
    visual: 'dish',
    sections: [
      {
        eyebrow: 'Signal chain',
        title: 'From the dish to the customer.',
        blocks: [{ kind: 'flow', steps: [{ t: 'Antenna' }, { t: 'RF chain' }, { t: 'Baseband' }, { t: 'Secure network' }, { t: 'Station control' }, { t: 'Customer' }], highlight: 5 }],
      },
      {
        eyebrow: 'GS-01',
        split: true,
        blocks: [
          {
            kind: 'specs',
            big: '7.5 m',
            note: 'India’s first commercial tri-band antenna',
            rows: [
              ['Bands', 'S, X and Ka'],
              ['Services', 'TT&C, payload downlink, reserved capacity'],
              ['Network', 'First node of the Akashaveda network'],
            ],
          },
          {
            kind: 'features',
            items: [
              { icon: 'pin', t: 'High-elevation passes', d: 'Long, high-elevation contacts across the station’s coverage region.' },
              { icon: 'calendar', t: 'Dynamic pass scheduling', d: 'Re-prioritises contact time during critical events.' },
              { icon: 'bolt', t: 'Edge ingestion', d: 'Data processed on site, delivered in minutes rather than hours.' },
            ],
          },
        ],
      },
    ],
    faq: [
      { q: 'What makes GS-01 different?', a: 'GS-01 is India’s first commercial 7.5 m antenna: a tri-band S, X and Ka station, and the first node of the Akashaveda network.' },
      { q: 'Which frequency bands does GS-01 support?', a: 'S, X and Ka band, on a 7.5 m tri-band antenna.' },
      { q: 'What services does GS-01 provide?', a: 'TT&C, payload downlink and reserved capacity, with dynamic pass scheduling and edge ingestion that delivers processed data in minutes rather than hours.' },
    ],
    cta: 'Book a pass on GS-01.',
  },
  {
    path: '/vyuh',
    name: 'Vyuh',
    seoTitle: 'Vyuh mission control and flight dynamics · Akashaveda',
    eyebrow: '02 — Control · Vyuh',
    title: 'Mission control that plans, checks and routes.',
    lede: 'Vyuh turns an operator’s intent into checked, routed commands: automation does the work in between, and the operator approves every critical action.',
    visual: 'sat',
    sections: [
      {
        eyebrow: 'How it works',
        title: 'Intent in, commands out.',
        split: true,
        blocks: [
          {
            kind: 'layers',
            items: [
              { k: 'Operator', t: 'Intent', d: 'One dashboard to set objectives, follow the timeline and pick up data products.' },
              { k: 'Core engine', t: 'Automation', d: 'Orbit determination, constraint checks, digital-twin simulation, anomaly prediction.' },
              { k: 'Ground gateway', t: 'Execution', d: 'Station-agnostic: picks the best pass, encrypts and routes approved commands.' },
            ],
          },
          {
            kind: 'list',
            label: 'Five specialised agents',
            items: [
              { k: 'A1', t: 'Payload Planner' },
              { k: 'A2', t: 'Orbit Agent' },
              { k: 'A3', t: 'Telemetry Analyser' },
              { k: 'A4', t: 'Simulation Agent' },
              { k: 'A5', t: 'Command Control' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Operator in the loop',
        blocks: [
          {
            kind: 'note',
            icon: 'shield',
            strong: 'The operator approves every critical action.',
            text: 'Role permissions and a full audit trail. Runs on cloud, on-premise or air-gapped, with our stations, third-party stations or both.',
          },
        ],
      },
      {
        eyebrow: 'Flight dynamics',
        title: 'Accurate orbit knowledge behind every contact.',
        blocks: [
          {
            kind: 'flow',
            steps: [
              { k: 'Input', t: 'Tracking data', d: 'Ground radar, optical, onboard GPS.' },
              { k: 'GPOD', t: 'Orbit determination', d: 'Fuses observations, filters out sensor and latency error.' },
              { k: 'GPOP', t: 'Propagation', d: 'Full gravity field, drag, solar pressure, third-body, relativity.' },
              { k: 'Output', t: 'Ephemeris & TLE', d: 'Precise ephemerides and NORAD-compatible TLE/3LE sets.' },
            ],
            highlight: 3,
          },
          {
            kind: 'features',
            label: 'Where it is used',
            items: [
              { icon: 'antenna', t: 'Every pass acquired', d: 'Accurate pointing for GS-01 and partner stations.' },
              { icon: 'rocket', t: 'Launch and early orbit', d: 'Initial orbit determination and acquisition support.' },
              { icon: 'route', t: 'Manoeuvres', d: 'Station-keeping and collision-avoidance burns, planned in Vyuh.' },
            ],
          },
        ],
      },
    ],
    faq: [
      { q: 'What is Vyuh?', a: 'Vyuh is Akashaveda’s mission control. It takes the operator’s intent, automates orbit determination, constraint checks, digital-twin simulation and anomaly prediction, then executes through the best available ground pass.' },
      { q: 'Does the operator stay in control?', a: 'Yes. The operator approves every critical action, with role permissions and a full audit trail.' },
      { q: 'Does Vyuh work with third-party ground stations?', a: 'Yes. Its ground gateway is station-agnostic and works with Akashaveda stations, third-party stations or both, on cloud, on-premise or air-gapped.' },
      { q: 'What does Vyuh flight dynamics produce?', a: 'Precise ephemerides and NORAD-compatible TLE/3LE sets, from orbit determination (GPOD) and propagation (GPOP) of radar, optical and onboard GPS tracking data.' },
    ],
    cta: 'See Vyuh run your mission.',
  },
  {
    path: '/chakra',
    name: 'Chakra',
    seoTitle: 'Chakra space safety and conjunction screening · Akashaveda',
    eyebrow: '03 — Comprehend · Chakra',
    title: 'Orbital data turned into a decision an analyst can defend.',
    lede: 'Chakra is a six-layer space domain engine that predicts close approaches, scores collision risk and designs avoidance manoeuvres, re-screened before the burn.',
    visual: 'globe',
    sections: [
      {
        eyebrow: 'Six-layer architecture',
        title: 'One central space domain engine.',
        blocks: [
          {
            kind: 'flow',
            steps: [{ t: 'Data sources' }, { t: 'Pre-processing' }, { t: 'Core engine' }, { t: 'Threat assessment' }, { t: 'Decision support' }, { t: 'Operator UI' }],
            highlight: 2,
          },
        ],
      },
      {
        eyebrow: 'Core engine',
        split: true,
        blocks: [
          {
            kind: 'list',
            label: 'Modules',
            items: [
              { k: 'SOCAP', t: 'Close-approach prediction', d: 'Against TLE, CDM and operator ephemerides.' },
              { k: 'SOCAA', t: 'Probability of collision', d: 'Tiered from Advisory to Immediate Action.' },
              { k: 'ACOLA', t: 'Avoidance manoeuvres', d: 'ML-designed, each re-screened before the burn.' },
              { k: 'SORP', t: 'Re-entry prediction', d: 'For objects that may threaten installations.' },
            ],
          },
          {
            kind: 'stats',
            label: 'Design targets · to be benchmarked',
            items: [
              { v: '≥ 100,000', k: 'objects tracked' },
              { v: '< 10 m', k: 'LEO orbit prediction' },
              { v: '< 10 s', k: 'threat detection latency' },
              { v: '99.9%', k: 'system uptime' },
            ],
          },
        ],
      },
      {
        eyebrow: 'IMAP · Mission design & analysis',
        title: 'Designed before launch, simulated end to end.',
        blocks: [
          {
            kind: 'flow',
            steps: [
              { k: 'Design', t: 'Mission design', d: 'Mission analysis upstream of launch.' },
              { k: 'Propagate', t: 'Orbit propagation', d: 'High-fidelity and physics-based, in 2D and 3D.' },
              { k: 'Optimise', t: 'Manoeuvre & trajectory', d: 'Manoeuvre and trajectory optimisation.' },
              { k: 'Link', t: 'RF link budgets', d: 'Link budgets and interference analysis.' },
              { k: 'Sense', t: 'Radar & sensors', d: 'Radar and sensor modelling for defence scenarios.' },
            ],
          },
          {
            kind: 'features',
            items: [
              { icon: 'compass', t: 'Upstream of launch', d: 'Mission design and analysis before anything flies.' },
              { icon: 'route', t: 'Physics-based 2D/3D simulation', d: 'High-fidelity orbit propagation, in two and three dimensions.' },
              { icon: 'antenna', t: 'RF and sensors', d: 'Link budgets, interference, and radar and sensor modelling for defence scenarios.' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Analytics · processing',
        title: 'From raw downlink to a map someone can act on.',
        blocks: [
          {
            kind: 'flow',
            steps: [{ k: 'Pre-processing', t: 'L0–L2' }, { k: 'AI analytics', t: 'L3' }, { k: 'Detection', t: 'Change' }, { k: 'Decision products', t: 'Output' }],
            highlight: 3,
          },
        ],
      },
    ],
    faq: [
      { q: 'What is Chakra?', a: 'Chakra is Akashaveda’s space domain engine. In six layers, from data sources to the operator UI, it predicts close approaches, scores collision risk, designs avoidance manoeuvres and predicts re-entries.' },
      { q: 'How does Chakra grade collision risk?', a: 'Its SOCAA module computes the probability of collision and tiers it from Advisory to Immediate Action.' },
      { q: 'How are avoidance manoeuvres designed?', a: 'Its ACOLA module designs them with machine learning, and each one is re-screened before the burn.' },
      { q: 'What is IMAP?', a: 'IMAP is Akashaveda’s mission design and analysis tool, used upstream of launch: physics-based 2D/3D simulation with high-fidelity orbit propagation, manoeuvre and trajectory optimisation, RF link budgets and interference, and radar and sensor modelling for defence scenarios.' },
      { q: 'How many objects can Chakra track?', a: 'Chakra’s design targets, still to be benchmarked, are at least 100,000 objects tracked, LEO orbit prediction under 10 m, threat detection under 10 s and 99.9% system uptime.' },
    ],
    cta: 'Put Chakra on your fleet.',
  },
];

/** The product page for a path (without the language prefix), from the given list. */
export const productAt = (path: string, list: ProductPage[] = PRODUCTS) => list.find((p) => p.path === path.replace(/\/+$/, ''));
