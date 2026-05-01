"use client";

import { useEffect, useRef } from "react";

type ConfettiCanvasProps = {
  active: boolean;
  onDone: () => void;
};

type ConfettiPiece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
};

const COLORS = ["#ff4d6d", "#ffd166", "#5eead4", "#c084fc", "#ffffff"];

export default function ConfettiCanvas({
  active,
  onDone
}: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      onDone();
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      onDone();
      return;
    }

    let animationFrame = 0;
    const startedAt = performance.now();

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pieces: ConfettiPiece[] = Array.from({ length: 150 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.28,
      vx: (Math.random() - 0.5) * 13,
      vy: Math.random() * -9 - 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 18,
      size: Math.random() * 9 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

    const render = (now: number) => {
      const elapsed = now - startedAt;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      pieces.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.22;
        piece.vx *= 0.992;
        piece.rotation += piece.rotationSpeed;

        context.save();
        context.translate(piece.x, piece.y);
        context.rotate((piece.rotation * Math.PI) / 180);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.58);
        context.restore();
      });

      if (elapsed < 2800) {
        animationFrame = requestAnimationFrame(render);
      } else {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        onDone();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrame);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [active, onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="confettiCanvas"
      aria-hidden="true"
      data-active={active}
    />
  );
}
