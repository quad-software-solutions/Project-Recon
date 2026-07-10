import React, { useEffect, useRef } from 'react';
import { Cpu, PackageCheck, RadioTower, ShoppingCart, Sparkles, Truck, Zap, CircuitBoard } from 'lucide-react';

interface Robotics3DShowcaseProps {
  variant?: 'hero' | 'store';
  onShop?: () => void;
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let running = true;
    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) animate();
      else cancelAnimationFrame(animFrame);
    });
    observer.observe(canvas);
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number; maxLife: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.2,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        life: 0,
        maxLife: Math.random() * 200 + 100,
      });
    }

    function animate() {
      if (!ctx || !canvas || !running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const fadeOut = p.life > p.maxLife * 0.7 ? 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3) : 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 180, 255, ${p.alpha * fadeOut})`;
        ctx.fill();

        if (p.life > p.maxLife || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(Math.random() * 0.3 + 0.1),
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2,
            life: 0,
            maxLife: Math.random() * 200 + 100,
          };
        }
      }

      animFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] pointer-events-none"
    />
  );
}

export default function Robotics3DShowcase({ variant = 'hero', onShop }: Robotics3DShowcaseProps) {
  const isStore = variant === 'store';
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className={`robotics-3d-stage ${isStore ? 'robotics-3d-stage-store' : ''} transition-all duration-500`}
      aria-label="3D robotics product showcase"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ParticleField />

      <div className="robotics-3d-orbit" style={{ animationDuration: hovered ? '8s' : '18s' }} />
      <div className="robotics-3d-orbit" style={{
        width: 'min(56%, 260px)',
        animationDuration: hovered ? '6s' : '14s',
        animationDirection: 'reverse',
        borderLeftColor: 'rgba(37, 99, 235, 0.5)',
        borderRightColor: 'rgba(237, 28, 36, 0.5)',
      }} />
      <div className="robotics-3d-grid" />

      {/* Radar sweep line */}
      <div className="absolute left-1/2 top-[46%] w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full z-[2] pointer-events-none" style={{
        background: 'conic-gradient(from 0deg, transparent 60%, rgba(37, 99, 235, 0.08) 70%, transparent 80%)',
        animation: 'radar-spin 4s linear infinite',
      }} />

      <div className="robotics-3d-card robotics-3d-card-left" style={{ borderColor: hovered ? 'rgba(37, 99, 235, 0.4)' : undefined }}>
        <Cpu className="w-4 h-4" />
        <span>ESP32 Lab Kit</span>
      </div>
      <div className="robotics-3d-card robotics-3d-card-right" style={{ borderColor: hovered ? 'rgba(237, 28, 36, 0.4)' : undefined }}>
        <PackageCheck className="w-4 h-4" />
        <span>Ships in Addis</span>
      </div>

      <div className="robotics-3d-scene">
        <div className="robotics-3d-robot" style={{ animationDuration: hovered ? '3.5s' : '5.8s' }}>
          <div className="robotics-3d-head" style={{ borderColor: hovered ? 'rgba(37, 99, 235, 0.8)' : undefined }}>
            <span className="robotics-3d-eye robotics-3d-eye-left" />
            <span className="robotics-3d-eye robotics-3d-eye-right" />
            <span className="robotics-3d-antenna" />
          </div>
          <div className="robotics-3d-neck" style={{ backgroundColor: hovered ? '#25338d' : undefined }} />
          <div className="robotics-3d-body">
            <div className="robotics-3d-panel">
              <span style={{ width: hovered ? '52px' : '42px', transition: 'width 0.3s' }} />
              <span style={{ width: hovered ? '38px' : '32px', transition: 'width 0.3s' }} />
              <span style={{ width: hovered ? '46px' : '36px', transition: 'width 0.3s' }} />
            </div>
            <div className="robotics-3d-core animate-core-pulse">
              <RadioTower className="w-5 h-5" />
            </div>
          </div>
          <div className="robotics-3d-arm robotics-3d-arm-left animate-arm-left" style={{ background: hovered ? 'linear-gradient(#ed1c24, #ff4444)' : undefined }} />
          <div className="robotics-3d-arm robotics-3d-arm-right animate-arm-right" style={{ background: hovered ? 'linear-gradient(#ed1c24, #ff4444)' : undefined }} />
          <div className="robotics-3d-base">
            <div className="robotics-3d-wheel robotics-3d-wheel-left animate-wheel-spin" />
            <div className="robotics-3d-wheel robotics-3d-wheel-right animate-wheel-spin" />
          </div>

          {/* Additional floating elements */}
          <div className="absolute -top-8 -right-6 text-[#ed1c24] opacity-60 animate-float-slow">
            <Zap className="w-5 h-5" />
          </div>
          <div className="absolute -bottom-6 -left-4 text-[#25338d] opacity-50 animate-float-medium">
            <CircuitBoard className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="robotics-3d-console" style={{ borderColor: hovered ? 'rgba(37, 99, 235, 0.3)' : undefined }}>
        <div>
          <p>{isStore ? 'Featured Build Bundle' : 'Ethio Robotics 3D Lab'}</p>
          <strong>{isStore ? 'From 5,400 ETB' : 'STEM kits, coaching, and competitions'}</strong>
        </div>
        {isStore ? (
          <button type="button" onClick={onShop}>
            <ShoppingCart className="w-4 h-4" />
            <span>Shop Kits</span>
          </button>
        ) : (
          <div className="robotics-3d-badge animate-glow-shift">
            <Sparkles className="w-4 h-4" />
            <span>Live Demo</span>
          </div>
        )}
      </div>

      {isStore && (
        <div className="robotics-3d-delivery">
          <Truck className="w-4 h-4" />
          <span>Local checkout: Chappa, Telebirr, CBE Birr</span>
        </div>
      )}
    </div>
  );
}
