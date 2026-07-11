import { useEffect, useRef } from 'react';

export default function AnimatedParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let anim: number;
    let running = true;
    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) draw();
      else cancelAnimationFrame(anim);
    });
    observer.observe(canvas);
    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({ x: Math.random() * 400, y: Math.random() * 400, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: Math.random() * 2 + 1 });
    }
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, 400, 400);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 400) p.vx *= -1; if (p.y < 0 || p.y > 400) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(37, 51, 141, 0.08)'; ctx.fill(); });
      anim = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(anim); observer.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} width={400} height={400} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-60" />;
}
