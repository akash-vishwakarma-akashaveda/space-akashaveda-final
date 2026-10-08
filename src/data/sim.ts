// Simulated telemetry and orbital math. Driven by UI tick, satellite state, and pass progress.

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const wobble = (tick: number, base: number, amp: number, k: number) => base + Math.sin(tick * 0.85 + k) * amp;

const series = (tick: number, amp: number, fr: number, k: number, offset = 20) =>
  Array.from({ length: 40 }, (_, i) => {
    const v = Math.sin((i + tick) * fr + k) * 0.65 + Math.sin((i + tick) * fr * 2.3 + k) * 0.35;
    return i * 5 + ',' + clamp(offset - v * amp, 3, 37).toFixed(1);
  }).join(' ');

export interface SubsystemTelemetry {
  eps: { busV: string; busI: string; soc: string; solarPwr: string };
  adcs: { mode: string; err: string; rwMax: string; rate: string };
  rf: { carrier: string; doppler: string; ebN0: string; rssi: string };
  obdh: { obcTemp: string; battTemp: string; ssrUsage: string; status: string; tempWarn?: boolean };
}

/** Live subsystem telemetry breakdown for the selected spacecraft */
export function getSubsystemTelemetry(satIndex: number, tick: number): SubsystemTelemetry {
  const isContact = satIndex === 0;
  const isThermalWatch = satIndex === 3;

  const obcT = isThermalWatch ? wobble(tick, 41.8, 0.35, 1) : wobble(tick, 23.4, 0.45, 2);
  const battT = isThermalWatch ? wobble(tick, 36.4, 0.25, 1) : wobble(tick, 18.2, 0.35, 0);

  const busV = isContact ? wobble(tick, 28.24, 0.08, 0) : wobble(tick, 27.92, 0.12, 1);
  const busI = isContact ? wobble(tick, 3.48, 0.14, 3) : wobble(tick, 2.12, 0.07, 2);
  const soc = isContact ? (94.2 + Math.sin(tick * 0.08) * 0.3).toFixed(1) + '%' : '88.6%';
  const solarPwr = isContact ? wobble(tick, 146.4, 2.1, 0).toFixed(0) + ' W' : '98 W';

  const doppler = isContact ? (14.2 - (tick % 60) * 0.47).toFixed(1) : '—';
  const rssi = isContact ? wobble(tick, -91.8, 1.2, 4).toFixed(1) + ' dBm' : 'STANDBY';
  const ebN0 = isContact ? wobble(tick, 13.8, 0.35, 1).toFixed(1) + ' dB' : '—';

  return {
    eps: {
      busV: busV.toFixed(2) + ' V',
      busI: busI.toFixed(2) + ' A',
      soc,
      solarPwr,
    },
    adcs: {
      mode: isContact ? 'NADIR_FINE' : 'SUN_POINT',
      err: wobble(tick, 0.038, 0.005, 1).toFixed(3) + '°',
      rwMax: (2410 + Math.floor(Math.sin(tick * 0.9) * 35)) + ' RPM',
      rate: '0.008 °/s',
    },
    rf: {
      carrier: isContact ? 'PCM / FRAME_LOCK' : 'AWAITING AOS',
      doppler: isContact ? `${Number(doppler) > 0 ? '+' : ''}${doppler} kHz` : '—',
      ebN0,
      rssi,
    },
    obdh: {
      obcTemp: (obcT > 0 ? '+' : '') + obcT.toFixed(1) + ' °C',
      battTemp: (battT > 0 ? '+' : '') + battT.toFixed(1) + ' °C',
      ssrUsage: '64.2% / 128 GB',
      status: isThermalWatch ? 'LIMIT_HIGH' : 'NOMINAL',
      tempWarn: isThermalWatch,
    },
  };
}

export function tmCharts(tick: number, satIndex = 0) {
  const isThermalWatch = satIndex === 3;
  const isContact = satIndex === 0;

  const obcBase = isThermalWatch ? 41.8 : 23.4;
  const obcAmp = isThermalWatch ? 0.35 : 0.55;
  const obcOffset = isThermalWatch ? 8 : 20;

  return [
    {
      k: 'BATT_BUS_V',
      v: wobble(tick, isContact ? 28.24 : 27.95, 0.1, 0).toFixed(2) + ' V',
      lim: '26.00 – 32.00 V',
      pts: series(tick, 7, 0.32, 0),
      col: 'var(--tm)',
      unit: 'EPS',
    },
    {
      k: 'OBC_TEMP',
      v: (obcBase > 0 ? '+' : '') + wobble(tick, obcBase, obcAmp, 2).toFixed(1) + ' °C',
      lim: '−10.0 – +45.0 °C',
      pts: series(tick, 4.5, 0.2, 2, obcOffset),
      col: isThermalWatch ? 'var(--warn)' : 'var(--tc)',
      unit: isThermalWatch ? 'OBDH · HIGH' : 'OBDH',
    },
    {
      k: 'RX_RSSI',
      v: isContact ? wobble(tick, -91.8, 1.3, 4).toFixed(1) + ' dBm' : 'STANDBY',
      lim: '−115.0 – −70.0 dBm',
      pts: isContact ? series(tick, 9, 0.5, 4) : series(0, 0.8, 0.05, 0, 32),
      col: 'var(--ok)',
      unit: 'RF TT&C',
    },
    {
      k: 'ADCS_POINT_ERR',
      v: wobble(tick, 0.038, 0.005, 1).toFixed(3) + '°',
      lim: '< 0.100° (3σ)',
      pts: series(tick, 5, 0.38, 1),
      col: 'var(--accT)',
      unit: 'ADCS',
    },
  ];
}

/** Antenna pointing for journey progress p (0–1), matching the 3D scene's pass geometry. */
export function antennaPointing(p: number) {
  const s = 0.28 + 0.42 * p;
  return { el: Math.max(0, 90 * Math.sin(Math.PI * s) * 0.92), az: (210 + p * 110) % 360 };
}

export const ebn0 = (tick: number) => wobble(tick, 13.8, 0.4, 1).toFixed(1) + ' dB';

/** Seconds to loss of signal, formatted mm:ss. */
export function losClock(p: number, tick: number) {
  const secs = Math.max(0, 540 - Math.floor(p * 400) - (tick % 60));
  return String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
}

