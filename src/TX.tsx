import React, { useEffect, useRef } from 'react';

const Fireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles: { x: number, y: number, radius: number, dx: number, dy: number, color: string }[] = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const createParticle = () => {
      const x = width / 2;
      const y = height;
      const radius = Math.random() * 3 + 1;
      const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle) * (Math.random() * 5 + 1);
      const dy = Math.sin(angle) * (Math.random() * 5 + 1);

      particles.push({ x, y, radius, dx, dy, color });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.radius -= 0.05;

        if (particle.radius < 0) {
          particles.splice(index, 1);
        }
      });

      requestAnimationFrame(draw);
    };

    const intervalId = setInterval(() => {
      for (let i = 0; i < 30; i++) {
        createParticle();
      }
    }, 200);

    draw();

    return () => clearInterval(intervalId);
  }, []);

  return (
    <canvas ref={canvasRef} />
  );
};

export default Fireworks;
