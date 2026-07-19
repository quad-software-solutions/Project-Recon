import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, ChevronRight, Code, Cpu, ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon, Gauge } from 'lucide-react';

// ─── ROBOT TYPES ─────────────────────────────────────────────────
interface RobotState {
  x: number; y: number; heading: number;
  penDown: boolean; penColor: string; penWidth: number; speed: number;
}

interface PenSegment {
  x1: number; y1: number; x2: number; y2: number;
  color: string; width: number;
}

type CommandType = 'forward' | 'backward' | 'turnLeft' | 'turnRight' | 'penUp' | 'penDown' | 'setColor' | 'wait';

interface RobotCommand {
  type: CommandType; value?: number; color?: string;
}

// ─── PARSER ──────────────────────────────────────────────────────
function parseCode(text: string): RobotCommand[] {
  const cmds: RobotCommand[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    const fwd = line.match(/robot\.driveFor\(FORWARD,\s*(\d+),\s*mm\);/);
    if (fwd) { cmds.push({ type: 'forward', value: Number(fwd[1]) }); continue; }
    const rev = line.match(/robot\.driveFor\(REVERSE,\s*(\d+),\s*mm\);/);
    if (rev) { cmds.push({ type: 'backward', value: Number(rev[1]) }); continue; }
    const left = line.match(/robot\.turnFor\(LEFT,\s*(\d+),\s*degrees\);/);
    if (left) { cmds.push({ type: 'turnLeft', value: Number(left[1]) }); continue; }
    const right = line.match(/robot\.turnFor\(RIGHT,\s*(\d+),\s*degrees\);/);
    if (right) { cmds.push({ type: 'turnRight', value: Number(right[1]) }); continue; }
    const color = line.match(/robot\.setPenColor\(["']([^"']+)["']\);/);
    if (color) { cmds.push({ type: 'setColor', color: color[1] }); continue; }
    if (line === 'robot.penDown();') { cmds.push({ type: 'penDown' }); continue; }
    if (line === 'robot.penUp();') { cmds.push({ type: 'penUp' }); continue; }
    const wait = line.match(/wait\((\d+),\s*msec\);/);
    if (wait) { cmds.push({ type: 'wait', value: Number(wait[1]) }); continue; }
  }
  return cmds;
}

function commandToLine(cmd: RobotCommand): string {
  switch (cmd.type) {
    case 'forward': return `robot.driveFor(FORWARD, ${cmd.value}, mm);`;
    case 'backward': return `robot.driveFor(REVERSE, ${cmd.value}, mm);`;
    case 'turnLeft': return `robot.turnFor(LEFT, ${cmd.value}, degrees);`;
    case 'turnRight': return `robot.turnFor(RIGHT, ${cmd.value}, degrees);`;
    case 'penDown': return 'robot.penDown();';
    case 'penUp': return 'robot.penUp();';
    case 'setColor': return `robot.setPenColor("${cmd.color}");`;
    case 'wait': return `wait(${cmd.value}, msec);`;
  }
}

// ─── PRESETS ─────────────────────────────────────────────────────
const PRESETS: { name: string; description: string; commands: RobotCommand[] }[] = [
  {
    name: 'Draw Square',
    description: 'Robot draws a perfect square pattern on the field',
    commands: [
      { type: 'penDown' }, { type: 'setColor', color: '#25338d' },
      { type: 'forward', value: 120 }, { type: 'turnRight', value: 90 },
      { type: 'forward', value: 120 }, { type: 'turnRight', value: 90 },
      { type: 'forward', value: 120 }, { type: 'turnRight', value: 90 },
      { type: 'forward', value: 120 }, { type: 'turnRight', value: 90 },
      { type: 'penUp' },
    ]
  },
  {
    name: 'Draw Triangle',
    description: 'Robot draws an equilateral triangle',
    commands: [
      { type: 'penDown' }, { type: 'setColor', color: '#10b981' },
      { type: 'forward', value: 150 }, { type: 'turnRight', value: 120 },
      { type: 'forward', value: 150 }, { type: 'turnRight', value: 120 },
      { type: 'forward', value: 150 }, { type: 'turnRight', value: 120 },
      { type: 'penUp' },
    ]
  },
  {
    name: 'Star Pattern',
    description: 'Five-pointed star via repeated forward + turn sequence',
    commands: [
      { type: 'penDown' }, { type: 'setColor', color: '#f59e0b' },
      ...Array.from({ length: 5 }).flatMap(() => [
        { type: 'forward' as CommandType, value: 140 },
        { type: 'turnRight' as CommandType, value: 144 },
      ]),
      { type: 'penUp' },
    ]
  },
  {
    name: 'Spiral',
    description: 'Expanding spiral outward from center',
    commands: [
      { type: 'penDown' }, { type: 'setColor', color: '#8b5cf6' },
      ...Array.from({ length: 20 }).flatMap((_, i) => [
        { type: 'forward' as CommandType, value: 10 + i * 8 },
        { type: 'turnRight' as CommandType, value: 60 },
      ]),
      { type: 'penUp' },
    ]
  },
  {
    name: 'Autonomous Navigate',
    description: 'Simulates autonomous path around obstacles',
    commands: [
      { type: 'penDown' }, { type: 'setColor', color: '#ef4444' },
      { type: 'forward', value: 80 }, { type: 'turnLeft', value: 45 },
      { type: 'forward', value: 60 }, { type: 'turnRight', value: 90 },
      { type: 'forward', value: 100 }, { type: 'turnLeft', value: 45 },
      { type: 'forward', value: 70 }, { type: 'turnRight', value: 90 },
      { type: 'forward', value: 50 }, { type: 'turnLeft', value: 135 },
      { type: 'forward', value: 120 }, { type: 'penUp' },
    ]
  },
];

// ─── LINE NUMBERS ────────────────────────────────────────────────
function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const lineCount = value.split('\n').length;
  return (
    <div className="relative flex bg-slate-900 rounded-lg border border-slate-700 focus-within:border-emerald-500/50 transition-colors overflow-hidden">
      <div className="select-none text-right px-2.5 py-3 text-[11px] leading-relaxed text-slate-600 font-mono bg-slate-900/50 border-r border-slate-800 min-w-[2.5rem]">
        {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={e => { onChange(e.target.value); }}
        spellCheck={false}
        className="flex-1 font-mono text-xs text-emerald-400 bg-transparent p-3 leading-relaxed resize-none outline-none min-h-[200px] placeholder:text-slate-700"
        placeholder="// Write your robot program here..."
      />
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function VexSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [robot, setRobot] = useState<RobotState>({
    x: 300, y: 300, heading: 0, penDown: false,
    penColor: '#25338d', penWidth: 2, speed: 3,
  });
  const [penTrails, setPenTrails] = useState<PenSegment[]>([]);
  const [commandQueue, setCommandQueue] = useState<RobotCommand[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [executionIndex, setExecutionIndex] = useState(0);
  const [codeView, setCodeView] = useState('');
  const [speedSetting, setSpeedSetting] = useState(3);

  const commandsToCode = useCallback((cmds: RobotCommand[]) => {
    return cmds.map(commandToLine).join('\n');
  }, []);

  const loadPreset = (index: number) => {
    handleReset();
    setActivePreset(index);
    setCodeView(commandsToCode(PRESETS[index].commands));
  };

  const handleReset = () => {
    setIsRunning(false);
    setRobot({ x: 300, y: 300, heading: 0, penDown: false, penColor: '#25338d', penWidth: 2, speed: speedSetting });
    setPenTrails([]);
    setExecutionIndex(0);
    cancelAnimationFrame(animRef.current);
  };

  // Execute commands step by step
  useEffect(() => {
    if (!isRunning || executionIndex >= commandQueue.length) {
      if (executionIndex >= commandQueue.length && commandQueue.length > 0) {
        setIsRunning(false);
      }
      return;
    }

    const cmd = commandQueue[executionIndex];
    let targetX = robot.x;
    let targetY = robot.y;
    let targetHeading = robot.heading;
    const speedMul = Math.max(0.25, 4 - robot.speed);
    let stepDuration = 400 * speedMul;

    switch (cmd.type) {
      case 'forward': {
        const rad = (robot.heading * Math.PI) / 180;
        targetX = robot.x + Math.cos(rad) * (cmd.value || 0);
        targetY = robot.y - Math.sin(rad) * (cmd.value || 0);
        stepDuration = Math.max(100, (cmd.value || 0) * 5 * speedMul);
        break;
      }
      case 'backward': {
        const rad = (robot.heading * Math.PI) / 180;
        targetX = robot.x - Math.cos(rad) * (cmd.value || 0);
        targetY = robot.y + Math.sin(rad) * (cmd.value || 0);
        stepDuration = Math.max(100, (cmd.value || 0) * 5 * speedMul);
        break;
      }
      case 'turnLeft':
        targetHeading = robot.heading + (cmd.value || 0);
        stepDuration = 200 * speedMul;
        break;
      case 'turnRight':
        targetHeading = robot.heading - (cmd.value || 0);
        stepDuration = 200 * speedMul;
        break;
      case 'penDown':
        setRobot(prev => ({ ...prev, penDown: true }));
        setExecutionIndex(prev => prev + 1);
        return;
      case 'penUp':
        setRobot(prev => ({ ...prev, penDown: false }));
        setExecutionIndex(prev => prev + 1);
        return;
      case 'setColor':
        setRobot(prev => ({ ...prev, penColor: cmd.color || '#25338d' }));
        setExecutionIndex(prev => prev + 1);
        return;
      case 'wait':
        setTimeout(() => setExecutionIndex(prev => prev + 1), (cmd.value || 500) * speedMul);
        return;
    }

    const startX = robot.x;
    const startY = robot.y;
    const startHeading = robot.heading;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / stepDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const newX = startX + (targetX - startX) * eased;
      const newY = startY + (targetY - startY) * eased;
      const newHeading = startHeading + (targetHeading - startHeading) * eased;

      setRobot(prev => {
        if (prev.penDown && (cmd.type === 'forward' || cmd.type === 'backward')) {
          setPenTrails(trails => {
            const last = trails[trails.length - 1];
            if (last && Math.abs(last.x2 - newX) < 0.5 && Math.abs(last.y2 - newY) < 0.5) return trails;
            return [...trails, { x1: prev.x, y1: prev.y, x2: newX, y2: newY, color: prev.penColor, width: prev.penWidth }];
          });
        }
        return { ...prev, x: newX, y: newY, heading: newHeading };
      });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setExecutionIndex(prev => prev + 1);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, executionIndex, commandQueue, robot.x, robot.y, robot.heading, robot.speed, robot.penDown, robot.penColor, robot.penWidth]);

  // Draw canvas — VEX competition field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, 600, 600);

      // ── Field floor ──
      ctx.fillStyle = '#f0f2f5';
      ctx.fillRect(0, 0, 600, 600);

      // Foam tile grid (VEX field pattern)
      const tileSize = 60;
      ctx.strokeStyle = '#dce0e8';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= 600; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
      }
      for (let y = 0; y <= 600; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke();
      }

      // Tile inner dots (VEX field pattern)
      ctx.fillStyle = '#d0d5e0';
      for (let tx = 0; tx < 10; tx++) {
        for (let ty = 0; ty < 10; ty++) {
          ctx.beginPath();
          ctx.arc(tx * tileSize + tileSize / 2, ty * tileSize + tileSize / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Field perimeter wall ──
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, 588, 588);

      // Inner wall edge
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, 576, 576);

      // Corner alliance markers
      const corners: [number, number, string, string][] = [
        [10, 10, '#ef4444', 'RED'],       // top-left
        [590, 10, '#ef4444', 'RED'],      // top-right
        [10, 590, '#25338d', 'BLUE'],     // bottom-left
        [590, 590, '#25338d', 'BLUE'],    // bottom-right
      ];
      for (const [cx, cy, color, _label] of corners) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color + '30';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Center marking ──
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 600); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(600, 300); ctx.stroke();
      ctx.setLineDash([]);

      // Center circle
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(300, 300, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Starting tile marker
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(280, 280, 40, 40);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(280, 280, 40, 40);

      // ── Pen trails ──
      penTrails.forEach(seg => {
        ctx.beginPath();
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = seg.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      });

      // ── Robot (VEX V5 style) ──
      ctx.save();
      ctx.translate(robot.x, robot.y);
      ctx.rotate(-robot.heading * Math.PI / 180);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.roundRect(-16, -12, 32, 24, 4);
      ctx.fill();

      // Chassis — VEX V5 rectangular
      const chassisColor = robot.penDown ? '#1a1a2e' : '#1e293b';
      ctx.fillStyle = chassisColor;
      ctx.beginPath();
      ctx.roundRect(-15, -11, 30, 22, 3);
      ctx.fill();

      // Chassis border
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-15, -11, 30, 22, 3);
      ctx.stroke();

      // VEX Brain (display screen on back)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-12, -8, 10, 16, 2);
      ctx.fill();

      // Brain screen pixels
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-10, -6, 6, 5);
      ctx.fillStyle = '#22c55e55';
      ctx.fillRect(-10, 0, 6, 3);

      // Front intake / mechanism
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, -6, 6, 12);

      // VEX logo stripe
      ctx.fillStyle = '#25338d';
      ctx.fillRect(-5, -12, 10, 2);
      ctx.fillRect(-5, 10, 10, 2);

      // Omni wheels
      ctx.fillStyle = '#64748b';
      // Left front
      ctx.beginPath();
      ctx.roundRect(-18, -12, 4, 7, 2);
      ctx.fill();
      // Left back
      ctx.beginPath();
      ctx.roundRect(-18, 5, 4, 7, 2);
      ctx.fill();
      // Right front
      ctx.beginPath();
      ctx.roundRect(14, -12, 4, 7, 2);
      ctx.fill();
      // Right back
      ctx.beginPath();
      ctx.roundRect(14, 5, 4, 7, 2);
      ctx.fill();

      // Wheel rollers (omni dots)
      ctx.fillStyle = '#94a3b8';
      for (const wx of [-16, 16]) {
        for (const wy of [-9, 8]) {
          ctx.beginPath();
          ctx.arc(wx, wy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Direction indicator (arrow on top)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(10, -4);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();

      // Speed indicator bar
      const speedPct = (robot.speed - 1) / 4;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, -14, 8, 2);
      ctx.fillStyle = speedPct > 0.5 ? '#22c55e' : '#f59e0b';
      ctx.fillRect(-4, -14, 8 * speedPct, 2);

      ctx.restore();

      // ── HUD overlay ──
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(4, 564, 592, 32, 6);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(`X:${Math.round(robot.x - 300)}mm  Y:${Math.round(300 - robot.y)}mm  H:${Math.round(((robot.heading % 360) + 360) % 360)}°  PEN:${robot.penDown ? 'DOWN' : 'UP'}  SPD:${robot.speed}`, 16, 584);

      if (isRunning) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(570, 580, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e44';
        ctx.beginPath();
        ctx.arc(570, 580, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    const frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [robot, penTrails, isRunning]);

  const runCode = useCallback(() => {
    const cmds = parseCode(codeView);
    if (cmds.length === 0) return;
    setCommandQueue(cmds);
    setRobot({ x: 300, y: 300, heading: 0, penDown: false, penColor: '#25338d', penWidth: 2, speed: speedSetting });
    setPenTrails([]);
    setExecutionIndex(0);
    setActivePreset(null);
    setIsRunning(true);
  }, [codeView, speedSetting]);

  const manualMove = (type: CommandType, value?: number, color?: string) => {
    if (isRunning) return;
    const cmd: RobotCommand = { type } as RobotCommand;
    if (value !== undefined) cmd.value = value;
    if (color !== undefined) cmd.color = color;
    setCodeView(prev => {
      const line = commandToLine(cmd);
      const stripped = prev.replace(/\/\/.*$/gm, '').trim();
      if (!stripped) return line;
      const lastLine = prev.split('\n').filter(l => l.trim()).pop() || '';
      if (lastLine === line) return prev;
      return prev + '\n' + line;
    });
    setCommandQueue([cmd]);
    setExecutionIndex(0);
    setIsRunning(true);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#ed1c24] flex items-center justify-center">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <p className="font-mono text-[10px] text-[#ed1c24] uppercase tracking-[0.2em] font-bold">Virtual Lab · VEX Robotics</p>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            Robot Simulation
          </h1>
          <p className="text-sm text-slate-400 mt-1">Program and visualize VEX robot movements in a 2D competition field environment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Canvas Area */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold">FIELD VIEW (600×600mm)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runCode}
                    disabled={isRunning || !parseCode(codeView).length}
                    className="bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500 active:scale-95 transition-all disabled:active:scale-100 shadow-lg shadow-emerald-900/20 disabled:shadow-none"
                  >
                    <Play className="w-3.5 h-3.5" /> Run
                  </button>
                  <button
                    onClick={() => setIsRunning(false)}
                    disabled={!isRunning}
                    className="bg-amber-600 disabled:bg-slate-700 disabled:text-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500 active:scale-95 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-600 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="w-full max-w-[600px] mx-auto aspect-square rounded-xl border border-slate-700 shadow-2xl"
              />
            </div>

            {/* Manual Controls + Speed */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold">MANUAL CONTROLS</span>
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={speedSetting}
                    onChange={e => { const v = Number(e.target.value); setSpeedSetting(v); setRobot(prev => ({ ...prev, speed: v })); }}
                    className="w-20 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="font-mono text-xs text-slate-400 w-4">{speedSetting}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => manualMove('turnLeft', 15)} className="bg-slate-700/50 hover:bg-slate-600 text-slate-300 p-2.5 rounded-lg active:scale-90 transition-all border border-slate-600/30" title="Turn Left 15°">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col gap-2">
                  <button onClick={() => manualMove('forward', 30)} className="bg-[#25338d]/30 hover:bg-[#25338d]/50 text-white p-2.5 rounded-lg active:scale-90 transition-all border border-[#25338d]/30" title="Forward 30mm">
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <button onClick={() => manualMove('backward', 30)} className="bg-[#25338d]/30 hover:bg-[#25338d]/50 text-white p-2.5 rounded-lg active:scale-90 transition-all border border-[#25338d]/30" title="Backward 30mm">
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={() => manualMove('turnRight', 15)} className="bg-slate-700/50 hover:bg-slate-600 text-slate-300 p-2.5 rounded-lg active:scale-90 transition-all border border-slate-600/30" title="Turn Right 15°">
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => manualMove(robot.penDown ? 'penUp' : 'penDown')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      robot.penDown
                        ? 'bg-emerald-600 text-white border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-700 text-slate-400 border-slate-600/30 hover:bg-slate-600'
                    }`}
                  >
                    PEN {robot.penDown ? 'DOWN' : 'UP'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4">
            {/* Presets */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 backdrop-blur-sm">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#ed1c24]" /> PROGRAM PRESETS
              </span>
              <div className="flex flex-col gap-2">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => loadPreset(i)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      activePreset === i
                        ? 'border-[#ed1c24]/50 bg-[#ed1c24]/5'
                        : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${activePreset === i ? 'text-white' : 'text-slate-300'}`}>{preset.name}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activePreset === i ? 'text-[#ed1c24] rotate-90' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Code Editor */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 backdrop-blur-sm flex-1 flex flex-col">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-500" /> Code Editor (Pseudocode)
              </span>
              <CodeEditor
                value={codeView || `// Write your robot program below.\n// Example:\n//   robot.driveFor(FORWARD, 120, mm);\n//   robot.turnFor(RIGHT, 90, degrees);\n`}
                onChange={v => { setCodeView(v); setActivePreset(null); }}
              />
            </motion.div>

            {/* Telemetry */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 backdrop-blur-sm">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-500" /> TELEMETRY
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/50">
                  <span className="text-[9px] text-slate-600 font-mono uppercase">Position X</span>
                  <p className="font-mono font-bold text-slate-200 text-sm">{Math.round(robot.x - 300)} mm</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/50">
                  <span className="text-[9px] text-slate-600 font-mono uppercase">Position Y</span>
                  <p className="font-mono font-bold text-slate-200 text-sm">{Math.round(300 - robot.y)} mm</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/50">
                  <span className="text-[9px] text-slate-600 font-mono uppercase">Heading</span>
                  <p className="font-mono font-bold text-slate-200 text-sm">{Math.round(((robot.heading % 360) + 360) % 360)}°</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/50">
                  <span className="text-[9px] text-slate-600 font-mono uppercase">Pen</span>
                  <p className={`font-mono font-bold text-sm ${robot.penDown ? 'text-emerald-400' : 'text-slate-500'}`}>{robot.penDown ? 'DOWN' : 'UP'}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/50">
                  <span className="text-[9px] text-slate-600 font-mono uppercase">{isRunning ? 'Status' : 'Ready'}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <p className="font-mono font-bold text-slate-200 text-sm">{isRunning ? 'RUNNING' : 'STOPPED'}</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/50">
                  <span className="text-[9px] text-slate-600 font-mono uppercase">Speed</span>
                  <p className="font-mono font-bold text-slate-200 text-sm">{speedSetting}/5</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
