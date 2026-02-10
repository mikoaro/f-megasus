import React, { useRef, useEffect } from 'react';

interface OrbProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const Orb: React.FC<OrbProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser?.frequencyBinCount || 256);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);

      let volume = 0;
      if (isActive && analyser) {
        analyser.getByteFrequencyData(dataArray);
        volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      }

      const baseRadius = width * 0.25;
      const pulseRadius = baseRadius + (volume * 0.5);

      // Shadow/Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, pulseRadius * 1.5);
      gradient.addColorStop(0, isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(100, 100, 100, 0.1)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Main Orb Body
      const orbGradient = ctx.createRadialGradient(
        centerX - pulseRadius * 0.3, 
        centerY - pulseRadius * 0.3, 
        pulseRadius * 0.1, 
        centerX, 
        centerY, 
        pulseRadius
      );
      
      if (isActive) {
        orbGradient.addColorStop(0, '#60a5fa');
        orbGradient.addColorStop(0.5, '#2563eb');
        orbGradient.addColorStop(1, '#1e3a8a');
      } else {
        orbGradient.addColorStop(0, '#4b5563');
        orbGradient.addColorStop(1, '#1f2937');
      }

      ctx.shadowBlur = isActive ? 30 : 5;
      ctx.shadowColor = isActive ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0,0,0,0.5)';
      
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Reflections
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(centerX - pulseRadius * 0.3, centerY - pulseRadius * 0.4, pulseRadius * 0.3, pulseRadius * 0.15, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Rings
      if (isActive && analyser) {
        const barCount = 64;
        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            const barHeight = (dataArray[i * 2] || 0) * 0.4;
            const x1 = centerX + Math.cos(angle) * (pulseRadius + 10);
            const y1 = centerY + Math.sin(angle) * (pulseRadius + 10);
            const x2 = centerX + Math.cos(angle) * (pulseRadius + 10 + barHeight);
            const y2 = centerY + Math.sin(angle) * (pulseRadius + 10 + barHeight);

            ctx.strokeStyle = `hsla(${210 + i}, 70%, 70%, 0.8)`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);

  return <canvas ref={canvasRef} width={200} height={100} className="w-full h-full cursor-pointer" />;
};

export default Orb;