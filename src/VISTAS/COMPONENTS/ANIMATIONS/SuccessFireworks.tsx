import { useEffect, useRef } from 'react';

const BURSTS = [
  { x: 0.2, y: 95, delay: 0, color: '#0DAD93' },
  { x: 0.8, y: 110, delay: 0.22, color: '#E9A916' },
  { x: 0.5, y: 55, delay: 0.48, color: '#8B5CF6' },
  { x: 0.3, y: 135, delay: 0.75, color: '#0EA5E9' },
  { x: 0.7, y: 85, delay: 1.05, color: '#EC4899' },
];
const LAUNCH_SECONDS = 0.4;
const SPARK_SECONDS = 1.8;

/** Celebración breve con estelas, estrellas y chispas, sin estado por cuadro. */
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
      sparks: Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2;
        const speed = 65 + Math.random() * 55;
        return { dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, star: index % 4 === 0 };
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
      if (elapsed > 3.5) { stop(); return; }

      for (const burst of bursts) {
        const age = elapsed - burst.delay;
        if (age < 0 || age > LAUNCH_SECONDS + SPARK_SECONDS) continue;
        const x = width * burst.x;
        ctx.strokeStyle = burst.color;
        ctx.fillStyle = burst.color;
        ctx.lineWidth = 2.5;
        if (age < LAUNCH_SECONDS) {
          const progress = age / LAUNCH_SECONDS;
          const y = height - (height - burst.y) * progress;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(x, Math.min(height, y + 20));
          ctx.lineTo(x, y);
          ctx.stroke();
          continue;
        }
        const time = age - LAUNCH_SECONDS;
        ctx.globalAlpha = (1 - time / SPARK_SECONDS) ** 1.2;
        const spread = Math.min(width / 400, 1);
        for (const spark of burst.sparks) {
          const trailTime = Math.max(0, time - 0.07);
          const sparkX = x + spark.dx * time * spread;
          const sparkY = burst.y + spark.dy * time + 25 * time ** 2;
          ctx.beginPath();
          ctx.moveTo(x + spark.dx * trailTime * spread, burst.y + spark.dy * trailTime + 25 * trailTime ** 2);
          ctx.lineTo(sparkX, sparkY);
          ctx.stroke();
          ctx.beginPath();
          if (spark.star) {
            for (let point = 0; point < 10; point++) {
              const angle = (point / 10) * Math.PI * 2 + time;
              const radius = point % 2 === 0 ? 6 : 2.5;
              const px = sparkX + Math.cos(angle) * radius;
              const py = sparkY + Math.sin(angle) * radius;
              if (point === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
          } else ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
          ctx.fill();
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

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 w-full motion-reduce:hidden" />;
}
