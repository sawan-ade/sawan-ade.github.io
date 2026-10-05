/**
 * Particle Waves Engine — Sawan Ade Portfolio (V1)
 * Full-viewport undulating 3D particle wave matrix on clean white background.
 * Spans 100% of the screen height and width across all pages and scroll positions.
 */
(function() {
  function initParticleWaves() {
    const canvas = document.getElementById('particleWavesCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;

    let baseTime = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;
    let scrollY = 0;
    let targetScrollY = 0;
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
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseleave', function() {
      targetMouseX = -1000;
      targetMouseY = -1000;
    }, { passive: true });

    window.addEventListener('scroll', function() {
      targetScrollY = window.pageYOffset || document.documentElement.scrollTop;
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
      baseTime += dt * 1.15;

      // Smooth mouse interpolation
      if (targetMouseX > -500) {
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
      } else {
        mouseX += (-1000 - mouseX) * 0.08;
        mouseY += (-1000 - mouseY) * 0.08;
      }

      // Smooth scroll parallax
      scrollY += (targetScrollY - scrollY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Grid spacing calculated to fill 100% of the viewport from top to bottom
      const stepY = Math.max(28, Math.min(42, height / 28));
      const stepX = Math.max(30, Math.min(46, width / 42));
      const numRows = Math.ceil(height / stepY) + 3;
      const numCols = Math.ceil(width / stepX) + 3;

      const time = baseTime + scrollY * 0.0018;

      const grid = [];

      // Compute wave coordinates across 100% of the screen
      for (let r = 0; r < numRows; r++) {
        const rowPoints = [];
        const y0 = (r - 1) * stepY;

        for (let c = 0; c < numCols; c++) {
          const x0 = (c - 1) * stepX;

          // Multi-octave sinusoidal wave equation
          const w1 = Math.sin(x0 * 0.0045 + time * 1.3) * Math.cos(y0 * 0.0055 + time * 0.95) * 26;
          const w2 = Math.sin((x0 + y0) * 0.0032 + time * 0.8) * 16;
          const w3 = Math.cos(x0 * 0.0026 - time * 0.55) * 11;
          const waveHeight = w1 + w2 + w3;

          // Mouse dynamic ripple
          let mouseRipple = 0;
          if (mouseX > -500) {
            const dx = x0 - mouseX;
            const dy = y0 - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 340) {
              const factor = (1 - dist / 340);
              mouseRipple = Math.sin(dist * 0.024 - time * 3.6) * 22 * factor * factor;
            }
          }

          const px = x0 + Math.sin(y0 * 0.0045 + time * 0.9) * 8;
          const py = y0 + waveHeight + mouseRipple;

          const isCrest = waveHeight > 10;
          const normalizedElev = Math.max(0, Math.min(1, (waveHeight + 40) / 80));
          const radius = Math.max(0.9, 1.2 + normalizedElev * 1.4);
          const alpha = Math.max(0.08, Math.min(0.42, 0.18 + normalizedElev * 0.24));

          rowPoints.push({
            x: px,
            y: py,
            r: radius,
            alpha: alpha,
            isCrest: isCrest,
            elev: waveHeight
          });
        }
        grid.push(rowPoints);
      }

      // 1. Draw smooth fluid wave spline ribbons along each row across the full screen
      for (let r = 0; r < numRows; r++) {
        const row = grid[r];
        if (!row.length) continue;

        ctx.beginPath();
        ctx.moveTo(row[0].x, row[0].y);

        for (let c = 0; c < row.length - 1; c++) {
          const p1 = row[c];
          const p2 = row[c + 1];
          const midX = (p1.x + p2.x) * 0.5;
          const midY = (p1.y + p2.y) * 0.5;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }

        const last = row[row.length - 1];
        ctx.lineTo(last.x, last.y);

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.065)';
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }

      // 2. Draw particle nodes at each wave intersection across the full screen
      for (let r = 0; r < numRows; r++) {
        const row = grid[r];
        for (let c = 0; c < row.length; c++) {
          const p = row[c];

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

          if (p.isCrest) {
            // Emerald/lime accent on wave peaks
            ctx.fillStyle = `rgba(101, 163, 13, ${Math.min(0.85, p.alpha * 1.9)})`;
          } else {
            // Slate particle dots on crisp white surface
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
