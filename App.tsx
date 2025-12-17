import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, RotateCcw, Info, Activity } from 'lucide-react';
import SimulationCanvas from './components/SimulationCanvas.tsx';
import { Ball, SimulationStats, HistoryPoint } from './types.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const App: React.FC = () => {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [stats, setStats] = useState<SimulationStats>({
    totalInCircle: 0,
    totalInSquare: 0,
    estimatedPi: 0,
    error: 0,
  });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  
  const canvasSize = { width: 600, height: 600 };

  // Simulation parameters
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;
  const radius = canvasSize.width * 0.4;
  const squareSize = radius * Math.sqrt(2);

  const generateBall = useCallback((): Ball => {
    // Generate point within circle using polar coordinates
    const r = radius * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const targetX = centerX + r * Math.cos(theta);
    const targetY = centerY + r * Math.sin(theta);

    // Check if it lands in the inscribed square
    const inSquare = (
      targetX >= centerX - squareSize / 2 &&
      targetX <= centerX + squareSize / 2 &&
      targetY >= centerY - squareSize / 2 &&
      targetY <= centerY + squareSize / 2
    );

    return {
      id: Math.random().toString(36).substring(2, 11),
      x: targetX,
      y: -20,
      targetX,
      targetY,
      progress: 0,
      color: inSquare ? '#f472b6' : '#38bdf8',
      inSquare,
      status: 'falling',
    };
  }, [centerX, centerY, radius, squareSize]);

  const dropBalls = useCallback((count: number) => {
    const newBalls = Array.from({ length: count }, generateBall);
    setBalls(prev => [...prev, ...newBalls]);
  }, [generateBall]);

  // Statistics calculation effect
  // This effect tracks landed balls and updates stats independently of the animation frame
  useEffect(() => {
    const landedBalls = balls.filter(b => b.status === 'landed');
    const landedCount = landedBalls.length;
    
    // Only update if we have new landed balls
    if (landedCount > stats.totalInCircle) {
      const inSquareCount = landedBalls.filter(b => b.inSquare).length;
      const estimatedPi = inSquareCount > 0 ? (2 * landedCount) / inSquareCount : 0;
      const error = Math.abs(Math.PI - estimatedPi) / Math.PI;

      setStats({
        totalInCircle: landedCount,
        totalInSquare: inSquareCount,
        estimatedPi,
        error,
      });

      // Update history every 10 balls to keep chart performance optimal
      if (landedCount % 10 === 0 || landedCount === 1) {
        setHistory(h => {
          // Prevent duplicate indices
          if (h.length > 0 && h[h.length - 1].index === landedCount) return h;
          const nextHistory = [...h, { index: landedCount, value: estimatedPi }];
          return nextHistory.slice(-100); // Keep last 100 points
        });
      }
    }
  }, [balls, stats.totalInCircle]);

  // Animation Loop using requestAnimationFrame for smoothness
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setBalls(prev => {
        let hasChanges = false;
        const next = prev.map(ball => {
          if (ball.status === 'falling') {
            hasChanges = true;
            const nextProgress = ball.progress + 0.08;
            if (nextProgress >= 1) {
              return { ...ball, progress: 1, status: 'landed' as const };
            }
            return { ...ball, progress: nextProgress };
          }
          return ball;
        });
        return hasChanges ? next : prev;
      });
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const resetSimulation = () => {
    setBalls([]);
    setStats({ totalInCircle: 0, totalInSquare: 0, estimatedPi: 0, error: 0 });
    setHistory([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto text-slate-100">
      <header className="w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent mb-4">
          Pi Monte Carlo Visualizer
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Approximating π by dropping balls into a circle with an inscribed square. 
          Formula: <span className="text-pink-400 font-mono font-bold">π ≈ 2 × (Total / Square)</span>.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start">
        <div className="lg:col-span-7 flex flex-col items-center space-y-8">
          <SimulationCanvas 
            balls={balls} 
            width={canvasSize.width} 
            height={canvasSize.height} 
            onBallLand={() => {}} 
          />
          
          <div className="flex flex-wrap justify-center gap-4 w-full">
            <button
              onClick={() => dropBalls(1)}
              className="px-6 py-4 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all font-semibold flex items-center gap-3 shadow-lg"
            >
              <Activity className="w-5 h-5 text-blue-400" /> Drop 1
            </button>
            <button
              onClick={() => dropBalls(100)}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all font-bold flex items-center gap-3 shadow-xl shadow-blue-900/40"
            >
              <Play className="w-5 h-5" /> Drop 100
            </button>
            <button
              onClick={() => dropBalls(500)}
              className="px-8 py-4 rounded-2xl bg-pink-600 hover:bg-pink-500 transition-all font-bold flex items-center gap-3 shadow-xl shadow-pink-900/40"
            >
              <Play className="w-5 h-5" /> Drop 500
            </button>
            <button
              onClick={resetSimulation}
              className="px-6 py-4 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-red-900/20 hover:border-red-900 transition-all font-semibold flex items-center gap-3 shadow-lg"
            >
              <RotateCcw className="w-5 h-5 text-red-400" /> Reset
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest opacity-80">Total Samples</span>
              <div className="text-4xl font-mono font-bold mt-2 text-white">{stats.totalInCircle.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <span className="text-xs font-black text-pink-400 uppercase tracking-widest opacity-80">Hits in Square</span>
              <div className="text-4xl font-mono font-bold mt-2 text-white">{stats.totalInSquare.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl col-span-2 relative overflow-hidden group">
              <div className="flex justify-between items-center relative z-10">
                <span className="text-xs font-black text-green-400 uppercase tracking-widest opacity-80">π Estimation</span>
                <span className={`text-[10px] px-3 py-1 font-bold rounded-full ${stats.error < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {(stats.error * 100).toFixed(4)}% Error
                </span>
              </div>
              <div className="text-6xl font-mono font-bold mt-3 text-white tracking-tighter relative z-10">
                {stats.estimatedPi.toFixed(7)}
              </div>
              <div className="text-xs text-slate-500 mt-4 italic font-medium flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                True Value: 3.14159265...
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col h-[400px]">
            <h3 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
              <Activity className="w-5 h-5 text-blue-500" /> Convergence Stability
            </h3>
            <div className="flex-grow w-full relative">
              {/* ResponsiveContainer needs a defined parent height to work */}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="index" hide />
                  <YAxis domain={[Math.PI - 0.2, Math.PI + 0.2]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                  />
                  <ReferenceLine y={Math.PI} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'π', fill: '#10b981', fontWeight: 'bold', fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={false}
                    animationDuration={200}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
              {history.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-medium italic">
                  Drop balls to see stability plot
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-20 w-full max-w-5xl grid md:grid-cols-2 gap-12 p-10 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/60 shadow-inner">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-white">
            <Info className="w-6 h-6 text-blue-400" /> Mathematical Logic
          </h2>
          <div className="space-y-4 text-slate-400 text-base leading-relaxed">
            <p>This simulation uses a <strong>Monte Carlo method</strong> to approximate π by comparing areas. We randomly distribute points within a known shape and observe the frequency of "hits" in a sub-region.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>The circle has area <span className="text-slate-200">A<sub>c</sub> = πR²</span>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 font-bold">•</span>
                <span>The inscribed square side is <span className="text-slate-200">R√2</span>, so its area is <span className="text-slate-200">A<sub>s</sub> = 2R²</span>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>The ratio is <span className="text-slate-200 font-mono">A<sub>c</sub> / A<sub>s</sub> = π / 2</span>.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="p-8 bg-slate-800/30 rounded-3xl border border-slate-700/50 shadow-xl">
            <p className="text-xs text-slate-500 uppercase font-black mb-4 tracking-tighter">Formula Transformation</p>
            <div className="font-mono text-lg space-y-3 text-slate-300">
              <div className="pb-2 border-b border-slate-700/50">
                <span className="text-blue-400">Hits<sub>Circle</sub></span> / <span className="text-pink-400">Hits<sub>Square</sub></span> ≈ π / 2
              </div>
              <div className="pt-2">
                π ≈ 2 × (<span className="text-blue-400">Total Samples</span> / <span className="text-pink-400">Square Hits</span>)
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-20 mb-12 text-slate-600 text-sm font-medium tracking-wide">
        Pure Mathematics Visualization &bull; Interactive Monte Carlo Simulation
      </footer>
    </div>
  );
};

export default App;