import React, { useState, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
  age: number;
}

const MouseTrail: React.FC = () => {
  const [trail, setTrail] = useState<Point[]>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setTrail((prevTrail) => {
      const newPoint = { x: e.clientX, y: e.clientY, age: 0 };
      const updatedTrail = prevTrail.map(point => ({ ...point, age: point.age + 1 }));
      return [...updatedTrail, newPoint].slice(-50);  // Keep last 50 points
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <svg 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 9999 
      }}
    >
      <defs>
        <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff00ff" />
          <stop offset="50%" stopColor="#00ffff" />
          <stop offset="100%" stopColor="#ff00ff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {trail.map((point, index) => {
        if (index === 0) return null;
        const prevPoint = trail[index - 1];
        const age = point.age / 50;  // Normalize age
        return (
          <line
            key={index}
            x1={prevPoint.x}
            y1={prevPoint.y}
            x2={point.x}
            y2={point.y}
            stroke="url(#trailGradient)"
            strokeWidth={Math.max(5 - age * 5, 0.5)}
            strokeLinecap="round"
            opacity={1 - age}
            filter="url(#glow)"
          />
        );
      })}
    </svg>
  );
};

export default MouseTrail;

