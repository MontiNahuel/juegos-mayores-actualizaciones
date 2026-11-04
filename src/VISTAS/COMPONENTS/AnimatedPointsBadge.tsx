import { useEffect, useRef, useState } from 'react';
import { PointsBadge } from './PointsBadge';

/** Solo interpola el saldo visible cuando llega una acreditación confirmada. */
export function AnimatedPointsBadge({ points, earned = 0 }: { points: number; earned?: number }) {
  const [displayed, setDisplayed] = useState(points);
  const previousEarned = useRef(0);

  useEffect(() => {
    const shouldAnimate = earned > 0 && previousEarned.current !== earned;
    if (!shouldAnimate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      previousEarned.current = earned;
      setDisplayed(points);
      return;
    }
    const from = Math.max(0, points - earned);
    let frame = 0;
    let started: number | undefined;
    setDisplayed(from);
    const tick = (now: number) => {
      previousEarned.current = earned;
      started ??= now;
      const progress = Math.min((now - started) / 800, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayed(Math.round(from + (points - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [points, earned]);

  return <span className="tabular-nums" aria-label={`${points} puntos`}>
    <span aria-hidden="true"><PointsBadge points={displayed} /></span>
  </span>;
}
