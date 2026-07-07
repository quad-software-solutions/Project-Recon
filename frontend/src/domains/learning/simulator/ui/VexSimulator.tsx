import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, ChevronRight, Code, Cpu, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon, CornerDownLeft } from 'lucide-react';

// ─── ROBOT TYPES ─────────────────────────────────────────────────
interface RobotState {
  x: number;
  y: number;
  heading: number; // degrees, 0 = right, counter-clockwise positive
  penDown: boolean;
  penColor: string;
  penWidth: number;
  speed: number;
}

interface PenSegment {
  x1: number; y1: number; x2: number; y2: number;
  color: string; width: number;
}

type CommandType = 'forward' | 'backward' | 'turnLeft' | 'turnRight' | 'penUp' | 'penDown' | 'setColor' | 'wait';

interface RobotCommand {
  type: CommandType;
  value?: number;
  color?: string;
}

// ─── PRESETS ─────────────────────────────────────────────────────
const PRESETS: { name: string; description: string; commands: RobotCommand[] }[] = [
  {
    name: 'Draw Square',
    description: 'Robot draws a perfect square pattern on the field',
    commands: [
      { type: 'penDown' },
      { type: 'setColor', color: '#25338d' },
      { type: 'forward', value: 120 },
      { type: 'turnRight', value: 90 },
      { type: 'forward', value: 120 },
      { type: 'turnRight', value: 90 },
      { type: 'forward', value: 120 },
      { type: 'turnRight', value: 90 },
      { type: 'forward', value: 120 },
      { type: 'turnRight', value: 90 },
      { type: 'penUp' },
    ]
  },
  {
    name: 'Draw Triangle',
    description: 'Robot draws an equilateral triangle',
    commands: [
      { type: 'penDown' },
      { type: 'setColor', color: '#10b981' },
      { type: 'forward', value: 150 },
      { type: 'turnRight', value: 120 },
      { type: 'forward', value: 150 },
      { type: 'turnRight', value: 120 },
      { type: 'forward', value: 150 },
      { type: 'turnRight', value: 120 },
      { type: 'penUp' },
    ]
  },
  {
    name: 'Star Pattern',
    description: 'Five-pointed star via repeated forward + turn sequence',
    commands: [
      { type: 'penDown' },
      { type: 'setColor', color: '#f59e0b' },
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
      { type: 'penDown' },
      { type: 'setColor', color: '#8b5cf6' },
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
      { type: 'penDown' },
      { type: 'setColor', color: '#ef4444' },
      { type: 'forward', value: 80 },
      { type: 'turnLeft', value: 45 },
      { type: 'forward', value: 60 },
      { type: 'turnRight', value: 90 },
      { type: 'forward', value: 100 },
      { type: 'turnLeft', value: 45 },
      { type: 'forward', value: 70 },
      { type: 'turnRight', value: 90 },
      { type: 'forward', value: 50 },
      { type: 'turnLeft', value: 135 },
      { type: 'forward', value: 120 },
      { type: 'penUp' },
    ]
  },
];

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

  // Convert commands to pseudocode display
  const commandsToCode = useCallback((cmds: RobotCommand[]) => {
    return cmds.map(c => {
      switch (c.type) {
        case 'forward': return `robot.driveFor(FORWARD, ${c.value}, mm);`;
        case 'backward': return `robot.driveFor(REVERSE, ${c.value}, mm);`;
        case 'turnLeft': return `robot.turnFor(LEFT, ${c.value}, degrees);`;
        case 'turnRight': return `robot.turnFor(RIGHT, ${c.value}, degrees);`;
        case 'penDown': return `robot.penDown();`;
        case 'penUp': return `robot.penUp();`;
        case 'setColor': return `robot.setPenColor("${c.color}");`;
        case 'wait': return `wait(${c.value}, msec);`;
        default: return '';
      }
    }).join('\n');
  }, []);

  // Load preset
  const loadPreset = (index: number) => {
    handleReset();
    setActivePreset(index);
    const preset = PRESETS[index];
    setCommandQueue(preset.commands);
    setCodeView(commandsToCode(preset.commands));
  };

  // Reset everything
  const handleReset = () => {
    setIsRunning(false);
    setRobot({ x: 300, y: 300, heading: 0, penDown: false, penColor: '#25338d', penWidth: 2, speed: 3 });
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
    let stepDuration = 400;

    switch (cmd.type) {
      case 'forward': {
        const rad = (robot.heading * Math.PI) / 180;
        targetX = robot.x + Math.cos(rad) * (cmd.value || 0);
        targetY = robot.y - Math.sin(rad) * (cmd.value || 0);
        stepDuration = Math.max(200, (cmd.value || 0) * 5);
        break;
      }
      case 'backward': {
        const rad = (robot.heading * Math.PI) / 180;
        targetX = robot.x - Math.cos(rad) * (cmd.value || 0);
        targetY = robot.y + Math.sin(rad) * (cmd.value || 0);
        stepDuration = Math.max(200, (cmd.value || 0) * 5);
        break;
      }
      case 'turnLeft':
        targetHeading = robot.heading + (cmd.value || 0);
        stepDuration = 300;
        break;
      case 'turnRight':
        targetHeading = robot.heading - (cmd.value || 0);
        stepDuration = 300;
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
        setTimeout(() => setExecutionIndex(prev => prev + 1), cmd.value || 500);
        return;
    }

    // Animate movement
    const startX = robot.x;
    const startY = robot.y;
    const startHeading = robot.heading;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / stepDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      const newX = startX + (targetX - startX) * eased;
      const newY = startY + (targetY - startY) * eased;
      const newHeading = startHeading + (targetHeading - startHeading) * eased;

      setRobot(prev => {
        // Add pen trail
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
  }, [isRunning, executionIndex, commandQueue]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, 600, 600);

      // Grid
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 600; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
      }

      // Center crosshair
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 600); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(600, 300); ctx.stroke();
      ctx.setLineDash([]);

      // Pen trails
      penTrails.forEach(seg => {
        ctx.beginPath();
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = seg.width;
        ctx.lineCap = 'round';
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      });

      // Robot body
      ctx.save();
      ctx.translate(robot.x, robot.y);
      ctx.rotate(-robot.heading * Math.PI / 180);

      // Robot chassis
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 20, 4);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#475569';
      ctx.fillRect(-16, -12, 4, 6);
      ctx.fillRect(-16, 6, 4, 6);
      ctx.fillRect(12, -12, 4, 6);
      ctx.fillRect(12, 6, 4, 6);

      // Direction indicator
      ctx.fillStyle = '#25338d';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(8, -5);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();

      // Sensor dot
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(10, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Coordinate label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`X: ${Math.round(robot.x - 300)}  Y: ${Math.round(300 - robot.y)}  H: ${Math.round(robot.heading % 360)}°`, 10, 590);

      requestAnimationFrame(draw);
    };

    const frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [robot, penTrails]);

  // Manual controls
  const manualMove = (type: CommandType, value: number) => {
    if (isRunning) return;
    setCommandQueue([{ type, value }]);
    setExecutionIndex(0);
    setIsRunning(true);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] text-[#25338d] uppercase tracking-widest font-bold mb-1">VIRTUAL LAB</p>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
            ROBOT SIMULATION
          </h1>
          <p className="text-sm text-slate-500 mt-1">Program and visualize robot movements in a 2D competition field environment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Canvas Area */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-brand-border-light shadow-sm p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-brand-muted uppercase tracking-widest font-bold">FIELD VIEW (600×600mm)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setExecutionIndex(0); setIsRunning(true); }}
                    disabled={commandQueue.length === 0 || isRunning}
                    className="bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Run
                  </button>
                  <button
                    onClick={() => setIsRunning(false)}
                    disabled={!isRunning}
                    className="bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600 active:scale-95 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="w-full max-w-[600px] mx-auto aspect-square bg-white rounded-xl border border-slate-200"
              />
            </div>

            {/* Manual Controls */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-brand-border-light shadow-sm p-4">
              <span className="font-mono text-[10px] text-brand-muted uppercase tracking-widest font-bold block mb-3">MANUAL CONTROLS</span>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => manualMove('turnLeft', 15)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-lg active:scale-90 transition-all" title="Turn Left">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col gap-2">
                  <button onClick={() => manualMove('forward', 30)} className="bg-[#25338d]/10 hover:bg-[#25338d]/20 text-[#25338d] p-2.5 rounded-lg active:scale-90 transition-all" title="Forward">
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <button onClick={() => manualMove('backward', 30)} className="bg-[#25338d]/10 hover:bg-[#25338d]/20 text-[#25338d] p-2.5 rounded-lg active:scale-90 transition-all" title="Backward">
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={() => manualMove('turnRight', 15)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-lg active:scale-90 transition-all" title="Turn Right">
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => setRobot(prev => ({ ...prev, penDown: !prev.penDown }))}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${robot.penDown ? 'bg-emerald-500 text-slate-900' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Pen {robot.penDown ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel: Presets + Code */}
          <div className="flex flex-col gap-4">
            {/* Presets */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-brand-border-light shadow-sm p-4">
              <span className="font-mono text-[10px] text-brand-muted uppercase tracking-widest font-bold block mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#25338d]" /> PROGRAM PRESETS
              </span>
              <div className="flex flex-col gap-2">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => loadPreset(i)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      activePreset === i
                        ? 'border-[#25338d] bg-[#25338d]/5'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">{preset.name}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activePreset === i ? 'text-[#25338d] rotate-90' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Code View */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-slate-50 rounded-2xl shadow-sm p-4 flex-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-3 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" /> Code Editor (Pseudocode)
              </span>
              <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap overflow-auto max-h-[300px]">
                {codeView || '// Select a preset or use manual controls\n// to begin programming your robot.\n\nvoid autonomous() {\n  // Your code here...\n}'}
              </pre>
            </motion.div>

            {/* Telemetry */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-brand-border-light shadow-sm p-4">
              <span className="font-mono text-[10px] text-brand-muted uppercase tracking-widest font-bold block mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> TELEMETRY
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-mono uppercase">Position X</span>
                  <p className="font-mono font-bold text-slate-800">{Math.round(robot.x - 300)} mm</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-mono uppercase">Position Y</span>
                  <p className="font-mono font-bold text-slate-800">{Math.round(300 - robot.y)} mm</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-mono uppercase">Heading</span>
                  <p className="font-mono font-bold text-slate-800">{Math.round(((robot.heading % 360) + 360) % 360)}°</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-mono uppercase">Pen</span>
                  <p className={`font-mono font-bold ${robot.penDown ? 'text-emerald-600' : 'text-slate-400'}`}>{robot.penDown ? 'ACTIVE' : 'INACTIVE'}</p>
                </div>
              </div>
            </motion.div>
          </div>
      </div>
    </div>
    </div>
  );
}
