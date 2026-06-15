"use client";

import { useEffect, useRef } from "react";

export default function InteractiveNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
    }> = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      // Get device pixel ratio for sharp rendering on retina screens
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
      
      // Initialize particles based on parent size
      initParticles(rect.width, rect.height);
    };

    const initParticles = (width: number, height: number) => {
      const particleCount = Math.min(120, Math.max(40, Math.floor((width * height) / 8000)));
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 1.2 + 1.2; // smaller base points (1.2px - 2.4px) for high contrast
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35, // calm, slow floating drift
          vy: (Math.random() - 0.5) * 0.35,
          radius: radius,
          baseRadius: radius,
        });
      }
    };

    // Initialize dimensions
    resizeCanvas();
    
    // Resize listener with small delay or standard resize handler
    window.addEventListener("resize", resizeCanvas);

    const container = canvas.parentElement;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    const animate = () => {
      // Clear the canvas. Note: since we used ctx.scale(dpr, dpr), we need to clear using the css dimensions.
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Detect light mode vs dark mode
      const isLightMode = document.documentElement.classList.contains("light-mode");
      // Dark mode: Cyan/Teal (6, 182, 212), Light mode: Sky Blue (2, 132, 199)
      const primaryColorRgb = isLightMode ? "2, 132, 199" : "6, 182, 212";

      const mouse = mouseRef.current;
      const maxDistance = 110;

      // Update particle positions
      particles.forEach((p) => {
        // Standard linear drifting
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off boundaries of container
        if (p.x < 0 || p.x > rect.width) p.vx *= -1;
        if (p.y < 0 || p.y > rect.height) p.vy *= -1;

        // Constraint within screen
        p.x = Math.max(0, Math.min(rect.width, p.x));
        p.y = Math.max(0, Math.min(rect.height, p.y));
      });

      // Draw connections between normal nodes (thicker to see and notice)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Connect particles to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            // Thicker connection lines by default (1.2px width, base alpha 0.25)
            const lineAlpha = (1 - dist / maxDistance) * 0.25;
            const lineWidth = 1.2;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${primaryColorRgb}, ${lineAlpha})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      }

      // Draw connection lines from cursor node to surrounding nodes (glowing & thick)
      if (mouse.active) {
        particles.forEach((p) => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const cursorMaxDist = 160;

          if (dist < cursorMaxDist) {
            const ratio = 1 - dist / cursorMaxDist;
            const lineAlpha = ratio * 0.55; // Bright glowing connections
            const lineWidth = 1.8; // Thick connection line radiating from cursor

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${primaryColorRgb}, ${lineAlpha})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        });
      }

      // Draw particles (nodes)
      particles.forEach((p) => {
        let radius = p.baseRadius;
        let opacity = 0.4; // Faint default nodes

        if (mouse.active) {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (dist < 160) {
            const ratio = 1 - dist / 160;
            // Particles connected to the cursor node light up
            radius = p.baseRadius * (1.0 + ratio * 0.5); // Enlarge slightly (up to 1.5x)
            opacity = 0.4 + ratio * 0.45; // Brighten (up to 0.85)
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColorRgb}, ${opacity})`;
        ctx.fill();
      });

      // Draw cursor node (added for cursor only with concentric rings)
      if (mouse.active) {
        const cursorRadius = 4.5;
        
        // Solid center filled circle for cursor
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, cursorRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColorRgb}, 1.0)`;
        ctx.fill();

        // Ring 1 (Concentric Inner Ring around cursor)
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, cursorRadius + 6.0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryColorRgb}, 0.6)`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Ring 2 (Concentric Outer Ring around cursor)
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, cursorRadius + 12.0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryColorRgb}, 0.25)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
