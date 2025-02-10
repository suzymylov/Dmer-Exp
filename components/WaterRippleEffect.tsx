import React, { useRef, useEffect } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  strength: number;
  time: number;
}

const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

const WaterRippleEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createRipple = (x: number, y: number) => {
      ripples.current.push({
        x,
        y,
        radius: 0,
        strength: 0.8,  // 从 0.7 增加到 0.8，使初始强度更高
        time: 0,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripples.current.forEach((ripple, index) => {
        ripple.radius += 1.5;  // 从 1 增加到 1.5，使扩散速度更快
        ripple.time += 0.05;
        ripple.strength *= 0.92;  // 从 0.98 改为 0.92，使衰减更快

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.strength * Math.sin(ripple.time)})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (ripple.strength < 0.03) {  // 从 0.01 增加到 0.03，使水波纹更快消失
          ripples.current.splice(index, 1);
        }
      });

      requestAnimationFrame(animate);
    };

    resizeCanvas();
    const throttledCreateRipple = throttle((e: MouseEvent) => createRipple(e.clientX, e.clientY), 70);  // 从 50 毫秒增加到 70 毫秒
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', throttledCreateRipple);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', throttledCreateRipple);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default WaterRippleEffect;

