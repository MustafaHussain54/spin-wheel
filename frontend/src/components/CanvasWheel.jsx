import React, { useRef, useEffect } from 'react';

/**
 * High-definition Canvas-based Wheel with metallic borders, gold indicator,
 * and custom corporate brand logo in the center hub
 */
export default function CanvasWheel({ prizes, rotation, isSpinning }) {
  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);

  // Preload brand logo image
  useEffect(() => {
    const img = new Image();
    img.src = '/jaliwala-pin.png';
    img.onload = () => {
      logoImgRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !prizes || prizes.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 25; // padding for rim & outer lights

    ctx.clearRect(0, 0, width, height);

    const totalSegments = prizes.length;
    const arcSize = (2 * Math.PI) / totalSegments;

    // Convert rotation degrees to radians
    const currentAngle = (rotation * Math.PI) / 180;

    // 1. Draw Outer Gold/Bronze Beveled Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
    const outerGrad = ctx.createLinearGradient(0, 0, width, height);
    outerGrad.addColorStop(0, '#F59E0B');
    outerGrad.addColorStop(0.25, '#FDE68A');
    outerGrad.addColorStop(0.5, '#B45309');
    outerGrad.addColorStop(0.75, '#FCD34D');
    outerGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = outerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.restore();

    // 2. Outer Light Bulbs
    const numBulbs = 24;
    for (let i = 0; i < numBulbs; i++) {
      const bulbAngle = (i * 2 * Math.PI) / numBulbs;
      const bulbX = centerX + (radius + 10) * Math.cos(bulbAngle);
      const bulbY = centerY + (radius + 10) * Math.sin(bulbAngle);

      ctx.save();
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 4.5, 0, 2 * Math.PI);
      const isLit = (i % 2 === 0 && Math.floor(rotation / 15) % 2 === 0) || (i % 2 !== 0 && Math.floor(rotation / 15) % 2 !== 0);
      ctx.fillStyle = isLit ? '#FFFFFF' : '#FEF08A';
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = isLit ? 10 : 3;
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Slices (Rotated)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    for (let i = 0; i < totalSegments; i++) {
      const angle = i * arcSize;
      const prize = prizes[i];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcSize);
      ctx.closePath();

      // Segment fill color
      ctx.fillStyle = prize.color || '#4F46E5';
      ctx.fill();

      // Segment border line
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Text in segment
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = prize.textColor || '#FFFFFF';

      // Contrast shadow to guarantee readability across light and dark slice colors
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Available radial distance from center hub (hubRadius 48 + 15) to outer rim (radius - 12)
      const maxAvailableWidth = radius - 75;
      const rawText = (prize.name || '').trim();

      // Smart multi-line splitting for long prize names (e.g., "The Dining Duo – Spoon Fork Set", "Additional 1% Discount...")
      let lines = [];
      if (rawText.includes(' - ') || rawText.includes(' – ')) {
        const parts = rawText.split(/\s*[-–]\s*/);
        lines = [parts[0], parts.slice(1).join(' – ')];
      } else if (rawText.length > 20) {
        // Break near middle on word boundary
        const words = rawText.split(' ');
        let l1 = '';
        let l2 = '';
        for (const w of words) {
          if ((l1 + ' ' + w).trim().length <= 18 && !l2) {
            l1 = (l1 + ' ' + w).trim();
          } else {
            l2 = (l2 + ' ' + w).trim();
          }
        }
        lines = l2 ? [l1, l2] : [l1];
      } else {
        lines = [rawText];
      }

      // Dynamic font sizing & auto-shrink to ensure complete visibility without clipping
      if (lines.length > 1) {
        let currentFontSize = totalSegments <= 6 ? 14 : totalSegments <= 8 ? 13 : 11.5;
        ctx.font = `800 ${currentFontSize}px Inter, -apple-system, system-ui, sans-serif`;

        // Check if widest line exceeds available width, shrink if needed
        let maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        while (maxLineWidth > maxAvailableWidth && currentFontSize > 9) {
          currentFontSize -= 0.5;
          ctx.font = `800 ${currentFontSize}px Inter, -apple-system, system-ui, sans-serif`;
          maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        }

        const lineHeight = currentFontSize * 1.25;
        const startY = -((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, lineIdx) => {
          let lineToDraw = line;
          while (ctx.measureText(lineToDraw).width > maxAvailableWidth && lineToDraw.length > 4) {
            lineToDraw = lineToDraw.slice(0, -1);
          }
          if (lineToDraw.length < line.length) lineToDraw += '..';
          ctx.fillText(lineToDraw, radius - 14, startY + (lineIdx * lineHeight));
        });
      } else {
        let currentFontSize = totalSegments <= 6 ? 17 : totalSegments <= 8 ? 15 : 13;
        ctx.font = `800 ${currentFontSize}px Inter, -apple-system, system-ui, sans-serif`;

        let measuredWidth = ctx.measureText(lines[0]).width;
        while (measuredWidth > maxAvailableWidth && currentFontSize > 10) {
          currentFontSize -= 0.5;
          ctx.font = `800 ${currentFontSize}px Inter, -apple-system, system-ui, sans-serif`;
          measuredWidth = ctx.measureText(lines[0]).width;
        }

        let lineToDraw = lines[0];
        while (ctx.measureText(lineToDraw).width > maxAvailableWidth && lineToDraw.length > 4) {
          lineToDraw = lineToDraw.slice(0, -1);
        }
        if (lineToDraw.length < lines[0].length) lineToDraw += '..';

        ctx.fillText(lineToDraw, radius - 14, 0);
      }

      ctx.restore();
    }

    ctx.restore();

    // 4. Center Corporate Brand Hub
    const hubRadius = 48;
    ctx.save();

    // Outer Hub Gold Rim with deep shadow
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 4, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, hubRadius + 4);
    centerGrad.addColorStop(0, '#FFFFFF');
    centerGrad.addColorStop(0.4, '#FDE68A');
    centerGrad.addColorStop(0.8, '#D97706');
    centerGrad.addColorStop(1, '#92400E');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Center circular white badge for crisp logo visibility
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#D97706';
    ctx.stroke();

    // Draw Jaliwala Emblem perfectly centered in hub
    const logoImg = logoImgRef.current;
    if (logoImg && logoImg.complete) {
      const imgWidth = 56;
      const imgHeight = 63;
      ctx.drawImage(
        logoImg,
        centerX - imgWidth / 2,
        centerY - imgHeight / 2,
        imgWidth,
        imgHeight
      );
    } else {
      // Elegant fallback text while image is loading
      ctx.fillStyle = '#B91C1C';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('JALIWALA', centerX, centerY - 6);
      ctx.fillStyle = '#EA580C';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('WIN', centerX, centerY + 10);
    }

    ctx.restore();

    // 5. Fixed Indicator / Pointer at Top (pointing down at 270 deg / top center)
    ctx.save();
    ctx.translate(centerX, centerY - radius - 12);
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(16, -10);
    ctx.lineTo(0, 22);
    ctx.closePath();

    const pointerGrad = ctx.createLinearGradient(-16, -10, 16, 22);
    pointerGrad.addColorStop(0, '#EF4444');
    pointerGrad.addColorStop(1, '#B91C1C');
    ctx.fillStyle = pointerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FEE2E2';
    ctx.stroke();

    // Pointer pivot pin
    ctx.beginPath();
    ctx.arc(0, -6, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FDE047';
    ctx.fill();

    ctx.restore();

  }, [prizes, rotation]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={580}
        height={580}
        className="w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      />
    </div>
  );
}
