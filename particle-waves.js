/**
 * Particle Waves Engine — Sawan Ade Portfolio (V1)
 * Interactive 3D undulating particle wave lattice on clean white backgrounds.
 * High-performance Canvas 2D perspective projection with 60 FPS animation.
 */
(function() {
  function initParticleWaves() {
    const canvas = document.getElementById('particleWavesCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Grid configuration
    const cols = 50;       // Number of columns across X
    const rows = 36;       // Number of rows in depth Z
    const spacingX = 42;
    const spacingZ = 38;
    const camY = 220;
    const camZ = -340;
    const fov = 370;
    const baseTilt = 0.38;

    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let animId = null;
    let isVisible = true;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    window.addEventListener('mousemove', function(e) {
      targetMouseX = (e.clientX - width / 2) / (width / 2);
      targetMouseY = (e.clientY - height / 2) / (height / 2);
    }, { passive: true });

    document.addEventListener('visibilitychange', function() {
      isVisible = !document.hidden;
      if (isVisible && !animId) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    });

    let lastTime = performance.now();

    function render(now) {
      if (!isVisible) {
        animId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      time += dt * 1.25;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const dynamicTilt = baseTilt + mouseY * 0.08;
      const cosT = Math.cos(dynamicTilt);
      const sinT = Math.sin(dynamicTilt);
      const halfCols = cols / 2;

      const grid = [];

      // 3D coordinate calculation
      for (let r = 0; r < rows; r++) {
        const rowPoints = [];
        const depthRatio = r / rows; // 0 (near) to 1 (far)

        for (let c = 0; c < cols; c++) {
          const colOffset = c - halfCols;
          const wx = colOffset * spacingX + mouseX * 50 * depthRatio;
          const wz = r * spacingZ;

          // Multi-harmonic undulating wave equation
          const w1 = Math.sin(colOffset * 0.16 + time * 1.4) * Math.cos(r * 0.14 + time * 1.0) * 34;
          const w2 = Math.sin((colOffset + r) * 0.09 + time * 0.85) * 20;
          const w3 = Math.cos(colOffset * 0.07 - time * 0.6) * 14;
          const wy = w1 + w2 + w3;

          // Camera translation
          const dx = wx;
          const dy = wy - camY;
          const dz = wz - camZ;

          // Pitch rotation
          const dy_p = dy * cosT - dz * sinT;
          const dz_p = dy * sinT + dz * cosT;

          if (dz_p > 15) {
            const scale = fov / dz_p;
            const sx = width / 2 + dx * scale;
            const sy = height / 2 + dy_p * scale + (height * 0.18);

            // Distance attenuation for crisp white background
            const alpha = Math.max(0.04, (1 - depthRatio * 0.8) * 0.38);
            const isCrest = wy > 15;
            const radius = Math.max(0.7, (2.8 - depthRatio * 1.8) * Math.min(scale, 1.35));

            rowPoints.push({
              x: sx,
              y: sy,
              r: radius,
              alpha: alpha,
              isCrest: isCrest,
              wy: wy
            });
          } else {
            rowPoints.push(null);
          }
        }
        grid.push(rowPoints);
      }

      // Draw delicate connecting wave filaments along rows
      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        const depthRatio = r / rows;
        const lineAlpha = Math.max(0.015, (1 - depthRatio * 0.82) * 0.14);

        ctx.beginPath();
        let started = false;
        for (let c = 0; c < cols; c++) {
          const p = row[c];
          if (!p) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = `rgba(15, 23, 42, ${lineAlpha})`;
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }

      // Draw particle dots
      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        for (let c = 0; c < cols; c++) {
          const p = row[c];
          if (!p) continue;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

          if (p.isCrest) {
            // Emerald/lime accent on wave crests
            ctx.fillStyle = `rgba(101, 163, 13, ${Math.min(0.85, p.alpha * 1.8)})`;
          } else {
            // High-contrast slate dots on white surface
            ctx.fillStyle = `rgba(15, 23, 42, ${p.alpha})`;
          }
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleWaves);
  } else {
    initParticleWaves();
  }
})();
