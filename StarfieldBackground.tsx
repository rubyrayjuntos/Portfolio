// StarfieldBackground.tsx
import React, { useEffect, useRef } from 'react';

const StarfieldBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth, h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    let numStars = 180;
    let starSpeed = 0.2;
    let starColor = "#ffffff";
    let stars = [];

    function createStars() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.2 + 0.2,
          speed: Math.random() * starSpeed + 0.05,
          alpha: Math.random() * 0.5 + 0.5
        });
      }
    }
    createStars();

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      createStars();
    }
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        ctx.fillStyle = starColor;
        ctx.shadowColor = starColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
        s.x -= s.speed;
        if (s.x < 0) s.x = w;
      }
      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="starfield-bg"
      className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-[#0a0a23]"
    ></canvas>
  );
};

export default StarfieldBackground;