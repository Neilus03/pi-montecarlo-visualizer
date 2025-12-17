
import React, { useEffect, useRef } from 'react';
import { Ball } from '../types';

interface SimulationCanvasProps {
  balls: Ball[];
  width: number;
  height: number;
  onBallLand: (ballId: string) => void;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ balls, width, height, onBallLand }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  const squareSize = radius * Math.sqrt(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw inscribed square
      ctx.beginPath();
      ctx.rect(centerX - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labeling areas
      ctx.font = '12px Inter';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Circle Area (πR²)', centerX - radius, centerY - radius - 10);
      ctx.fillText('Inscribed Square (2R²)', centerX - squareSize / 2, centerY + squareSize / 2 + 20);

      // Draw balls
      balls.forEach((ball) => {
        const x = ball.status === 'falling' ? ball.targetX : ball.targetX;
        const y = ball.status === 'falling' 
          ? -20 + (ball.targetY + 20) * ball.progress 
          : ball.targetY;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        
        // Glow effect for balls
        if (ball.status === 'falling') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ball.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [balls, width, height, centerX, centerY, radius, squareSize]);

  return (
    <div className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto cursor-crosshair"
      />
    </div>
  );
};

export default SimulationCanvas;
