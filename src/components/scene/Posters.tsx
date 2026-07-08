import { useMemo } from 'react';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';
import type { PosterSpec } from '../../data/eras';

/**
 * Wall posters + advertisements per era.
 * Generated as canvas textures with text & shapes, mounted on wall planes with frames.
 */
export function Posters() {
  const era = useEraAssets();

  return (
    <group>
      {era.posters.map((poster, i) => (
        <Poster key={`${era.id}-poster-${i}`} spec={poster} index={i} />
      ))}
    </group>
  );
}

function Poster({ spec, index }: { spec: PosterSpec; index: number }) {
  // Generate the poster texture from the spec
  const texture = useMemo(() => generatePosterTexture(spec), [spec]);

  // Spread posters on left and right walls
  const positions: Array<[number, number, number, [number, number, number]]> = [
    // Left wall
    [-7.95, 3.5, -1, [0, Math.PI / 2, 0]],
    // Right wall
    [7.95, 3.5, -1, [0, -Math.PI / 2, 0]],
  ];

  const [pos, rot] = positions[index % positions.length]!;

  return (
    <group position={pos} rotation={rot}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[1.35, 1.75, 0.04]} />
        <meshStandardMaterial color="#2a1a0e" roughness={0.6} />
      </mesh>
      {/* Poster artwork */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.2, 1.6]} />
        <meshStandardMaterial map={texture} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Generate a poster canvas texture from the spec. */
function generatePosterTexture(spec: PosterSpec): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(size * 0.75);
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  // Background
  ctx.fillStyle = spec.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw motif
  drawMotif(ctx, canvas.width, canvas.height, spec);

  // Title text
  ctx.fillStyle = spec.fg;
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = spec.title.split('\n');
  const titleY = canvas.height * 0.3;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, titleY + i * 48);
  });

  // Subtitle
  ctx.font = 'italic 22px sans-serif';
  ctx.fillStyle = spec.fg;
  ctx.fillText(spec.subtitle, canvas.width / 2, canvas.height * 0.7);

  // Decorative line
  ctx.strokeStyle = spec.fg;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.15, canvas.height * 0.55);
  ctx.lineTo(canvas.width * 0.85, canvas.height * 0.55);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: PosterSpec,
): void {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = spec.fg;
  ctx.strokeStyle = spec.fg;

  const cx = w / 2;
  const cy = h / 2;

  switch (spec.motif) {
    case 'starburst': {
      const rays = 24;
      ctx.translate(cx, cy);
      for (let i = 0; i < rays; i++) {
        ctx.rotate((Math.PI * 2) / rays);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.6, -10);
        ctx.lineTo(w * 0.6, 10);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'stripes': {
      const stripeCount = 12;
      for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
          ctx.fillRect((i / stripeCount) * w, 0, w / stripeCount, h);
        }
      }
      break;
    }
    case 'grid': {
      ctx.lineWidth = 2;
      const grid = 40;
      for (let x = 0; x <= w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      break;
    }
    case 'silhouette': {
      // Silhouette of a dancing person
      ctx.beginPath();
      ctx.ellipse(cx, cy - 60, 20, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 12, cy - 35, 24, 80);
      // Arms
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 20);
      ctx.lineTo(cx - 50, cy - 50);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy - 20);
      ctx.lineTo(cx + 50, cy + 20);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 45);
      ctx.lineTo(cx - 30, cy + 120);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 45);
      ctx.lineTo(cx + 30, cy + 120);
      ctx.stroke();
      break;
    }
    case 'orb': {
      // Concentric circles
      for (let r = 200; r > 0; r -= 30) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Center filled orb
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'waves': {
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 5) {
          const y = cy + Math.sin((x / w) * Math.PI * 4 + i * 0.5) * (30 - i * 2) + (i - 4) * 40;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}
