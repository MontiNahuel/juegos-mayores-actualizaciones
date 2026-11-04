import { useEffect, useRef } from 'react';

const BURSTS = [
  { x: 0.2, y: 65, delay: 0, color: '#53BFC9' },
  { x: 0.8, y: 80, delay: 0.35, color: '#D99A28' },
  { x: 0.5, y: 40, delay: 0.7, color: '#9B87D5' },
];
const LAUNCH_SECONDS = 0.4;
const SPARK_SECONDS = 1.2;

/** Celebración breve y decorativa: tres lanzamientos, sin bucle ni estado por cuadro. */
export function SuccessFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!canvas || reducedMotion?.matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let started: number | undefined;
    let stopped = false;
    const bursts = BURSTS.map(burst => ({
      ...burst,
      sparks: Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const speed = 30 + Math.random() * 35;
        return { dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed };
      }),
    }));

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.lineCap = 'round';
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (now: number) => {
      if (stopped) return;
      started ??= now;
      const elapsed = (now - started) / 1000;
      ctx.clearRect(0, 0, width, height);
      if (elapsed > 2.5) { stop(); return; }

      for (const burst of bursts) {
        const age = elapsed - burst.delay;
        if (age < 0 || age > LAUNCH_SECONDS + SPARK_SECONDS) continue;
        const x = width * burst.x;
        ctx.strokeStyle = burst.color;
        ctx.lineWidth = 1.8;
        if (age < LAUNCH_SECONDS) {
          const progress = age / LAUNCH_SECONDS;
          const y = height - (height - burst.y) * progress;
          ctx.globalAlpha = 0.65;
          ctx.beginPath();
          ctx.moveTo(x, Math.min(height, y + 12));
          ctx.lineTo(x, y);
          ctx.stroke();
          continue;
        }
        const time = age - LAUNCH_SECONDS;
        ctx.globalAlpha = 0.8 * (1 - time / SPARK_SECONDS) ** 2;
        for (const spark of burst.sparks) {
          const trailTime = Math.max(0, time - 0.07);
          ctx.beginPath();
          ctx.moveTo(x + spark.dx * trailTime, burst.y + spark.dy * trailTime + 20 * trailTime ** 2);
          ctx.lineTo(x + spark.dx * time, burst.y + spark.dy * time + 20 * time ** 2);
          ctx.stroke();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      ctx.clearRect(0, 0, width, height);
    };
    const onMotionChange = () => { if (reducedMotion?.matches) stop(); };
    const onVisibilityChange = () => { if (document.hidden) stop(); };
    reducedMotion?.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    frame = requestAnimationFrame(draw);

    return () => {
      stop();
      reducedMotion?.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 w-full motion-reduce:hidden" />;
}
