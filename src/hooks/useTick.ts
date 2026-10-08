import { useEffect, useState } from 'react';

/** Counter that increments every `ms`; drives the simulated console readouts. */
export function useTick(ms = 800) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}
