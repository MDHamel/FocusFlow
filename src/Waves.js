import React, { useRef, useEffect, useState } from 'react';


const waves = [
  {
    y: 0.1,
    length: 0.01,
    amplitude: 45,
    frequency: .5,
  },
  {
    y: 0.4,
    length: 0.01,
    amplitude: 42,
    frequency: 1,
  },
  {
    y: 0.7,
    length: 0.01,
    amplitude: 39,
    frequency: 1.5,
  }
];

export default function Waves({ palette }) {
  const canvasRef = useRef(null);
  const timeRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(animationRef.current);
    animateWaves();
  }, [palette]);

  const drawWaves = (time) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    let waveHeight = canvas.height * 0.4 > 300 ? canvas.height * 0.4 : 300; // Minimum height of 300px

    for (const waveConfig of waves) {
      const topWave = {
        y: waveConfig.y * canvas.height,
        length: waveConfig.length,
        amplitude: waveConfig.amplitude,
        frequency: waveConfig.frequency,
      };

      const bottomWave = {
        y: topWave.y + waveHeight,
        length: waveConfig.length,
        amplitude: waveConfig.amplitude * 0.65,
        frequency: waveConfig.frequency,
      };

      const color = palette[waves.indexOf(waveConfig)];

      context.beginPath();
      context.moveTo(0, topWave.y);

      for (let i = 0; i < canvas.width; i++) {
        context.lineTo(
          i,
          topWave.y - Math.sin(i * topWave.length + time * topWave.frequency) * topWave.amplitude
        );
      }

      context.lineTo(canvas.width, topWave.y);

      context.lineTo(canvas.width, bottomWave.y);

      for (let i = canvas.width; i >= 0; i--) {
        context.lineTo(
          i,
          bottomWave.y - Math.sin(i * bottomWave.length + time * bottomWave.frequency) * bottomWave.amplitude
        );
      }

      context.lineTo(0, bottomWave.y);
      context.lineTo(0, topWave.y);

      context.lineWidth = 5;
      context.strokeStyle = "transparent";
      context.stroke();

      const gradient = context.createLinearGradient(0, 0, 0, bottomWave.y);
      gradient.addColorStop(0, `${color}ff`);
      gradient.addColorStop(0.45, `${color}e8`);
      gradient.addColorStop(1, `${color}50`);
      context.fillStyle = gradient;
      context.fill();
    }
  };

  const animateWaves = () => {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      timeRef.current = elapsedTime / 1000; // Convert to seconds
      drawWaves(timeRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeHandler = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height - 4;
    };

    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas once before drawing the waves

    animateWaves(); // Start the animation loop

    return () => {
      window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(animationRef.current); // Cancel the animation frame on component unmount
    };
  }, []);

  return <canvas ref={canvasRef} className="wavebg" />;
}
