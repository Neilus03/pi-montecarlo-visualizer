import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Info, Activity } from 'lucide-react';
import SimulationCanvas from './components/SimulationCanvas';
import { Ball, SimulationStats, HistoryPoint } from './types';
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
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  
  const canvasSize = { width: 600, height: 600 };

  // Simulation parameters
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;
  const radius = canvasSize.width * 0.4;
  const squareSize = radius * Math.sqrt(2);

  const generateBall = useCallback((): Ball => {
    // We generate a point within the circle using polar coordinates
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
      id: Math.random().toString(36).substr(2, 9),
      x: targetX,
      y: -20, // Start above canvas
      targetX,
      targetY,
      progress: 0,
      color: inSquare ? '#f472b6' : '#38bdf8', // Pink if in square, blue if in circle gap
      inSquare,
      status: 'falling',
    };
  }, [centerX, centerY, radius, squareSize]);

  const dropBalls = useCallback((count: number) => {
    const newBalls = Array.from({ length: count }, generateBall);
    setBalls(prev => [...prev, ...newBalls]);
    setIsSimulationRunning(true);
  }, [generateBall]);

  const updateStats = useCallback((landedBall: Ball) => {
    setStats(prev => {
      const newTotal = prev.totalInCircle + 1;
      const newInSquare = prev.totalInSquare + (landedBall.inSquare ? 1 : 0);
      
      // Math: Area_circle / Area_square = (pi * R^2) / (2 * R^2) = pi / 2
      // So Pi = 2 * (Total in Circle / Total in Square)
      const estimatedPi = newInSquare > 0 ? (2 * newTotal) / newInSquare : 0;
      const error = Math.abs(Math.PI - estimatedPi) / Math.PI;

      // Update history every 10 balls. We accumulate history to show convergence over time.
      if (newTotal % 10 === 0) {
        setHistory(h => [...h, { index: newTotal, value: estimatedPi }]);
      }

      return {
        totalInCircle: newTotal,
        totalInSquare: newInSquare,
        estimatedPi,
        error,
      };
    });
  }, []);

  // Animation loop
  useEffect(() => {
    if (balls.length === 0) return;

    const interval = setInterval(() => {
      setBalls(prev => {
        let changed = false;
        const updated = prev.map(ball => {
          if (ball.status === 'falling') {
            changed = true;
            const nextProgress = ball.progress + 0.05;
            if (nextProgress >= 1) {
              updateStats(ball);
              return { ...ball, progress: 1, status: 'landed' as const };
            }
            return { ...ball, progress: nextProgress };
          }
          return ball;
        });
        
        if (!changed) setIsSimulationRunning(false);
        return updated;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [balls, updateStats]);

  const resetSimulation = () => {
    setBalls([]);
    setStats({ totalInCircle: 0, totalInSquare: 0, estimatedPi: 0, error: 0 });
    setHistory([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto">
      {/* Header */}
      <header className="w-full text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent mb-2">
          Pi Monte Carlo Visualizer
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Approximating π by dropping balls into a circle with an inscribed square. 
          The ratio of the areas allows us to estimate the constant: <span className="text-pink-400 font-mono">π ≈ 2 × (Total / Square)</span>.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Section: Simulation Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-6">
          <SimulationCanvas 
            balls={balls} 
            width={canvasSize.width} 
            height={canvasSize.height} 
            onBallLand={() => {}} 
          />
          
          <div className="flex flex-wrap justify-center gap-4 w-full">
            <button
              onClick={() => dropBalls(1)}
              className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all font-medium flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-blue-400" /> Drop 1
            </button>
            <button
              onClick={() => dropBalls(100)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <Play className="w-4 h-4" /> Drop 100
            </button>
            <button
              onClick={() => dropBalls(500)}
              className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 transition-all font-bold flex items-center gap-2 shadow-lg shadow-pink-900/40"
            >
              <Play className="w-4 h-4" /> Drop 500
            </button>
            <button
              onClick={resetSimulation}
              className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-red-900/30 hover:border-red-900 transition-all font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-red-400" /> Reset
            </button>
          </div>
        </div>

        {/* Right Section: Stats */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total Balls (Circle)</span>
              <div className="text-3xl font-mono font-bold mt-1">{stats.totalInCircle.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">In Square</span>
              <div className="text-3xl font-mono font-bold mt-1">{stats.totalInSquare.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Estimated Pi</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${stats.error < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {(stats.error * 100).toFixed(4)}% Error
                </span>
              </div>
              <div className="text-5xl font-mono font-bold mt-2 text-white">
                {stats.estimatedPi.toFixed(7)}
              </div>
              <div className="text-xs text-slate-500 mt-2 italic">Actual π ≈ 3.1415926</div>
            </div>
          </div>

          {/* History Chart */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-64 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Convergence Chart
            </h3>
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="index" hide />
                  <YAxis domain={[3.0, 3.3]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={Math.PI} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'π', fill: '#10b981', fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <section className="mt-16 w-full max-w-4xl grid md:grid-cols-2 gap-8 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-400" /> How it works
          </h2>
          <ul className="space-y-3 text-slate-400 text-sm">
            <li>1. A circle is drawn with an <strong>inscribed square</strong>.</li>
            <li>2. Points (balls) are dropped randomly into the circle.</li>
            <li>3. The area of the circle is <strong>πR²</strong>.</li>
            <li>4. The area of the inscribed square is <strong>2R²</strong>.</li>
            <li>5. The ratio of (Circle Area / Square Area) is <strong>π / 2</strong>.</li>
            <li>6. Therefore, <strong>π ≈ 2 × (Balls in Circle / Balls in Square)</strong>.</li>
          </ul>
        </div>
        <div className="flex flex-col justify-center">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Mathematical Proof</p>
                <div className="font-mono text-sm space-y-1">
                    <p>Radius = R</p>
                    <p>Circle Area = πR²</p>
                    <p>Square Diagonal = 2R</p>
                    <p>Square Side (s) = 2R / √2 = R√2</p>
                    <p>Square Area = s² = (R√2)² = 2R²</p>
                    <p className="pt-2 text-blue-400">Ratio = πR² / 2R² = π / 2</p>
                </div>
            </div>
        </div>
      </section>

      <footer className="mt-12 mb-8 text-slate-600 text-sm">
        Built by Neil de la Fuente @ ETH Zurich.
      </footer>
    </div>
  );
};

export default App;