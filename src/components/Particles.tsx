import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

export function Particles() {
  const { settings } = useStore();
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const p = settings.particles;
    if (!p.enabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    type Particle = { x: number; y: number; r: number; vy: number; vx: number; rot: number; vr: number };
    const items: Particle[] = Array.from({ length: p.count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: p.size * (0.5 + Math.random()),
      vy: (0.4 + Math.random()) * p.speed,
      vx: (Math.random() - 0.5) * 0.6 * p.speed,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.04,
    }));

    const drawSnow = (it: Particle) => {
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fill();
    };
    const drawDot = (it: Particle) => {
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "color-mix(in oklab, var(--color-primary) 80%, white)";
      ctx.fill();
    };
    const drawStar = (it: Particle) => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      const spikes = 5,
        outer = it.r * 0.6,
        inner = it.r * 0.25;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i * Math.PI) / spikes;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const drawSakura = (it: Particle) => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.fillStyle = "rgba(255,182,193,0.85)";
      for (let i = 0; i < 5; i++) {
        ctx.rotate((Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -it.r * 0.4, it.r * 0.25, it.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = (it: Particle) => {
      switch (p.shape) {
        case "snow": return drawSnow(it);
        case "dot": return drawDot(it);
        case "star": return drawStar(it);
        case "sakura": return drawSakura(it);
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const it of items) {
        it.y += it.vy;
        it.x += it.vx;
        it.rot += it.vr;
        if (it.y > h + 20) {
          it.y = -20;
          it.x = Math.random() * w;
        }
        if (it.x < -20) it.x = w + 20;
        if (it.x > w + 20) it.x = -20;
        draw(it);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [settings.particles]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
