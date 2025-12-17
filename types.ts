
export interface Ball {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1 for animation
  color: string;
  inSquare: boolean;
  status: 'falling' | 'landed';
}

export interface SimulationStats {
  totalInCircle: number;
  totalInSquare: number;
  estimatedPi: number;
  error: number;
}

export interface HistoryPoint {
  index: number;
  value: number;
}
