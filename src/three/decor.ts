import * as THREE from 'three';
import { matColor, matWood, matMetal, matGlass, matEmit } from './materials';
import {
  makePosterTexture,
  makeMenuTexture,
  makeNeonTexture,
  makeClockTexture,
  makeWifiTexture,
} from './textures';
import { TABLE_POSITIONS } from './furniture';
import type { Era, MenuItem } from '../types';

/** Inner face of the back wall is z = -6; decor sits slightly proud of it. */
const BACK_Z = -5.94;

interface PosterPlacement {
  slot: string;
  x: number;
  y: number;
}

const POSTER_PLACEMENTS: PosterPlacement[] = [
  { slot: 'left', x: -2.9, y: 1.85 },
  { slot: 'center', x: 0, y: 1.95 },
  { slot: 'right', x: 2.9, y: 1.85 },
];

function add(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  opts: { rx?: number; ry?: number; rz?: number; cast?: boolean; receive?: boolean } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  parent.add(m);
  return m;
}

/** Apply an era's posters to the back wall (frame sits behind the poster). */
function buildPosters(group: THREE.Group, era: Era): void {
  for (const poster of era.posters) {
    const placement = POSTER_PLACEMENTS.find((p) => p.slot === poster.slot);
    if (!placement) continue;
    const texture = makePosterTexture({
      title: poster.title,
      caption: poster.caption,
      year: String(era.year),
      accent: poster.accent,
    });
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0,
    });
    add(group, new THREE.PlaneGeometry(1.05, 1.55), material, placement.x, placement.y, BACK_Z);
    const frameMat = matWood('#4a3320');
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.74, 0.06), frameMat);
    frame.position.set(placement.x, placement.y, BACK_Z - 0.03);
    group.add(frame);
  }
}

/** Hanging clock on the back wall, reused across eras. */
function buildClock(group: THREE.Group): void {
  const texture = makeClockTexture();
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), material);
  face.position.set(4.6, 2.55, BACK_Z);
  group.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 10, 32), matMetal('#8a7a5e', 0.4));
  rim.position.copy(face.position);
  group.add(rim);
}

/** Menu board on the left wall, driven by the era menu spec. */
function buildMenuBoard(group: THREE.Group, era: Era): void {
  const texture = makeMenuTexture({
    title: era.menu.title,
    subtitle: `Est. ${Math.max(1927, era.year - 20)}`,
    items: era.menu.items,
    background: '#1f3d2b',
    ink: '#f4e9d0',
    accent: '#c9a227',
  });
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
  add(group, new THREE.PlaneGeometry(1.5, 2.0), material, 0, 0, 0);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.62, 2.12, 0.05), matWood('#5c3a1e'));
  frame.position.set(0, 0, -0.04);
  group.add(frame);
}

/** Espresso machine, era-dependent look (group origin sits on the counter top). */
function buildEspressoMachine(group: THREE.Group, era: Era): void {
  const chrome = matMetal('#c8c8c8', 0.18);
  const black = matColor('#26262a', { roughness: 0.35, metalness: 0.5 });
  switch (era.id) {
    case 'e1945': {
      const body = matMetal('#b07a3c', 0.3);
      add(group, new THREE.BoxGeometry(0.9, 0.5, 0.45), body, 0, 0.25, 0);
      add(group, new THREE.CylinderGeometry(0.24, 0.24, 0.4, 20), chrome, 0, 0.7, 0);
      add(group, new THREE.SphereGeometry(0.13, 16, 12), chrome, 0, 0.96, 0);
      add(group, new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), chrome, 0.3, 0.55, 0.1);
      break;
    }
    case 'e1965': {
      add(group, new THREE.BoxGeometry(0.5, 0.42, 0.42), chrome, 0, 0.21, 0);
      add(group, new THREE.CylinderGeometry(0.1, 0.12, 0.6, 16), chrome, 0, 0.72, 0);
      add(group, new THREE.SphereGeometry(0.14, 16, 12), chrome, 0, 1.06, 0);
      add(group, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), chrome, 0.24, 0.6, 0.05);
      break;
    }
    case 'e1985': {
      add(group, new THREE.BoxGeometry(1.0, 0.55, 0.5), chrome, 0, 0.27, 0);
      add(group, new THREE.CylinderGeometry(0.09, 0.09, 0.35, 14), chrome, -0.24, 0.62, 0);
      add(group, new THREE.CylinderGeometry(0.09, 0.09, 0.35, 14), chrome, 0.24, 0.62, 0);
      add(group, new THREE.BoxGeometry(0.3, 0.16, 0.1), matEmit('#ff6b6b', 0.6), 0, 0.42, 0.24);
      break;
    }
    case 'e2005': {
      add(group, new THREE.BoxGeometry(0.95, 0.5, 0.5), chrome, 0, 0.25, 0);
      add(group, new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), matMetal('#3f7fd4', 0.3), -0.2, 0.62, 0);
      add(group, new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), matMetal('#3f7fd4', 0.3), 0.2, 0.62, 0);
      add(group, new THREE.BoxGeometry(0.4, 0.12, 0.06), matEmit('#66e0ff', 0.8), 0, 0.4, 0.26);
      break;
    }
    case 'e2025': {
      add(group, new THREE.BoxGeometry(1.0, 0.5, 0.5), black, 0, 0.25, 0);
      add(group, new THREE.BoxGeometry(1.05, 0.04, 0.54), matWood('#8a5a2b'), 0, 0.52, 0);
      add(group, new THREE.CylinderGeometry(0.06, 0.06, 0.28, 12), matMetal('#c9c9c9', 0.3), -0.24, 0.62, 0);
      add(group, new THREE.CylinderGeometry(0.06, 0.06, 0.28, 12), matMetal('#c9c9c9', 0.3), 0.24, 0.62, 0);
      break;
    }
    case 'e2055': {
      const holo = matColor('#9ad0ff', {
        emissive: '#6fb6ff',
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
        metalness: 0.2,
      });
      add(group, new THREE.BoxGeometry(1.1, 0.55, 0.5), holo, 0, 0.27, 0);
      add(group, new THREE.ConeGeometry(0.16, 0.4, 18), holo, 0, 0.7, 0);
      add(group, new THREE.SphereGeometry(0.1, 14, 12), matEmit('#8fd8ff', 1.4), 0, 0.98, 0);
      break;
    }
  }
}

/** Era music device, placed on shelves / tables / floor. */
export function buildMusicDevice(era: Era): THREE.Group {
  const g = new THREE.Group();
  g.name = 'MusicDevice';
  const black = matColor('#222222', { roughness: 0.45, metalness: 0.4 });
  switch (era.musicDeviceIndex) {
    case 0: {
      // bakelite radio
      add(g, new THREE.BoxGeometry(0.6, 0.38, 0.28), matColor('#3a2418', { roughness: 0.5 }), 0, 0.19, 0);
      add(g, new THREE.BoxGeometry(0.36, 0.2, 0.03), matEmit('#ffcf8f', 0.8), 0, 0.2, 0.145);
      add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), matColor('#c9a227', { roughness: 0.3, metalness: 0.8 }), 0.22, 0.19, 0);
      break;
    }
    case 1: {
      // jukebox
      add(g, new THREE.BoxGeometry(0.8, 1.15, 0.55), matWood('#7a2f1e'), 0, 0.57, 0);
      add(g, new THREE.BoxGeometry(0.64, 0.5, 0.08), matColor('#ffe9a8', { emissive: '#ffb36b', emissiveIntensity: 0.5 }), 0, 0.82, 0.3);
      add(g, new THREE.BoxGeometry(0.7, 0.14, 0.5), matColor('#2b2b2b', { roughness: 0.3, metalness: 0.6 }), 0, 0.28, 0);
      for (const lx of [-0.22, 0, 0.22]) {
        add(g, new THREE.BoxGeometry(0.06, 0.3, 0.02), matEmit('#ffd27f', 1), lx, 0.62, 0.3);
      }
      break;
    }
    case 2: {
      // boombox
      add(g, new THREE.BoxGeometry(0.7, 0.34, 0.22), black, 0, 0.17, 0);
      add(g, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), matColor('#d0d0d0', { roughness: 0.3, metalness: 0.4 }), -0.18, 0.17, 0.12);
      add(g, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), matColor('#d0d0d0', { roughness: 0.3, metalness: 0.4 }), 0.18, 0.17, 0.12);
      add(g, new THREE.BoxGeometry(0.2, 0.08, 0.02), matEmit('#40e0ff', 0.9), 0, 0.2, 0.12);
      break;
    }
    case 3: {
      // iPod dock
      add(g, new THREE.BoxGeometry(0.18, 0.05, 0.12), matColor('#e9e9e9', { roughness: 0.2, metalness: 0.3 }), 0, 0.03, 0);
      add(g, new THREE.BoxGeometry(0.1, 0.14, 0.02), matEmit('#e9e9e9', 0.5), 0, 0.13, 0.07);
      add(g, new THREE.BoxGeometry(0.34, 0.05, 0.16), matColor('#d8d8d8', { roughness: 0.3 }), 0, 0.09, 0);
      break;
    }
    case 4: {
      // phone
      add(g, new THREE.BoxGeometry(0.09, 0.18, 0.006), matColor('#1a1a1a', { roughness: 0.15, metalness: 0.6 }), 0, 0.09, 0);
      add(g, new THREE.BoxGeometry(0.08, 0.16, 0.004), matEmit('#2b6fae', 0.6), 0, 0.09, 0.005);
      break;
    }
    case 5: {
      // holo-player
      const holo = matColor('#9ad0ff', {
        emissive: '#7aa2ff',
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8,
      });
      add(g, new THREE.TorusGeometry(0.16, 0.025, 10, 26), holo, 0, 0.4, 0);
      add(g, new THREE.ConeGeometry(0.12, 0.3, 18), holo, 0, 0.65, 0);
      add(g, new THREE.SphereGeometry(0.06, 12, 10), matEmit('#c86bff', 1.2), 0, 0.85, 0);
      break;
    }
  }
  return g;
}

/** Potted plant used in most eras. */
function buildPlant(group: THREE.Group, holographic = false): void {
  const pot = matColor('#b0562e', { roughness: 0.7 });
  add(group, new THREE.CylinderGeometry(0.18, 0.13, 0.32, 14), pot, 0, 0.16, 0);
  const leaf = holographic
    ? matColor('#8fd8ff', { emissive: '#8fd8ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.8 })
    : matColor('#3f7d4a', { roughness: 0.8 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), leaf);
    stem.position.set(Math.cos(a) * 0.1, 0.42, Math.sin(a) * 0.1);
    stem.rotation.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
    group.add(stem);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), leaf);
    tip.position.set(Math.cos(a) * 0.16, 0.66, Math.sin(a) * 0.16);
    group.add(tip);
  }
}

/** Tableware for a table (local coords relative to the table top, y=0). */
function buildTableware(group: THREE.Group, era: Era): void {
  const cupWhite = matColor('#f7f3ea', { roughness: 0.3 });
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.015, 20), cupWhite);
  saucer.position.y = 0.01;
  group.add(saucer);
  switch (era.id) {
    case 'e1945': {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.08, 16), cupWhite);
      cup.position.y = 0.07;
      group.add(cup);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 14), cupWhite);
      handle.position.set(0.06, 0.07, 0);
      group.add(handle);
      break;
    }
    case 'e1965': {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 16), matColor('#d95f3b', { roughness: 0.35 }));
      cup.position.y = 0.07;
      group.add(cup);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.16, 14), matGlass('#cfe8ff', 0.5));
      glass.position.set(0.22, 0.09, 0.1);
      group.add(glass);
      break;
    }
    case 'e1985': {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 16), matColor('#3a2b6e', { roughness: 0.4 }));
      mug.position.y = 0.08;
      group.add(mug);
      const napkin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.01, 0.16), matColor('#e8e8e8', { roughness: 0.9 }));
      napkin.position.set(-0.18, 0.015, 0.08);
      group.add(napkin);
      break;
    }
    case 'e2005': {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.11, 16), matColor('#ffffff', { roughness: 0.4 }));
      cup.position.y = 0.09;
      group.add(cup);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.02, 16), matColor('#f5f5f5', { roughness: 0.3 }));
      lid.position.y = 0.15;
      group.add(lid);
      break;
    }
    case 'e2025': {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.085, 16), matColor('#ffffff', { roughness: 0.3 }));
      cup.position.y = 0.08;
      group.add(cup);
      const croissant = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 8, 14), matColor('#c98a3a', { roughness: 0.7 }));
      croissant.position.set(-0.2, 0.05, 0.05);
      croissant.rotation.x = Math.PI / 2;
      group.add(croissant);
      const phone = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.005), matColor('#1a1a1a', { roughness: 0.2, metalness: 0.5 }));
      phone.position.set(0.24, 0.09, -0.12);
      group.add(phone);
      break;
    }
    case 'e2055': {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.09, 16), matColor('#9ad0ff', { emissive: '#6fb6ff', emissiveIntensity: 0.5, transparent: true, opacity: 0.8 }));
      cup.position.y = 0.09;
      group.add(cup);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 18), matColor('#8fd8ff', { emissive: '#8fd8ff', emissiveIntensity: 0.8 }));
      ring.position.y = 0.02;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      break;
    }
  }
}

/** Era lighting fixture attached to the ceiling pole. */
export function buildLightFixture(era: Era): THREE.Group {
  const g = new THREE.Group();
  g.name = 'LightFixture';
  g.position.set(0, 2.3, 0);
  const bulbMat = (c: string) => matEmit(c, 1.1);
  switch (era.id) {
    case 'e1945': {
      const brass = matMetal('#b07a3c', 0.3);
      add(g, new THREE.ConeGeometry(0.22, 0.3, 18, 1, true), brass, 0, -0.15, 0);
      add(g, new THREE.SphereGeometry(0.1, 12, 10), bulbMat('#ffcf8f'), 0, -0.34, 0);
      break;
    }
    case 'e1965': {
      const cone = matColor('#d95f3b', { roughness: 0.4 });
      add(g, new THREE.ConeGeometry(0.26, 0.34, 20, 1, true), cone, 0, -0.17, 0);
      add(g, new THREE.SphereGeometry(0.11, 12, 10), bulbMat('#ffd9a0'), 0, -0.38, 0);
      break;
    }
    case 'e1985': {
      const neon = matEmit('#ff3da6', 1.4);
      const tube = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 10, 26), neon);
      tube.rotation.x = Math.PI / 2;
      tube.position.y = -0.3;
      g.add(tube);
      add(g, new THREE.SphereGeometry(0.09, 12, 10), bulbMat('#ff5fd0'), 0, -0.34, 0);
      break;
    }
    case 'e2005': {
      const track = matMetal('#9a9a9a', 0.4);
      add(g, new THREE.BoxGeometry(0.5, 0.06, 0.18), track, 0, -0.1, 0);
      add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), track, -0.18, -0.18, 0);
      add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), track, 0.18, -0.18, 0);
      add(g, new THREE.SphereGeometry(0.06, 10, 8), bulbMat('#ffe4b0'), -0.18, -0.27, 0);
      add(g, new THREE.SphereGeometry(0.06, 10, 8), bulbMat('#ffe4b0'), 0.18, -0.27, 0);
      break;
    }
    case 'e2025': {
      const wood = matWood('#8a5a2b');
      add(g, new THREE.BoxGeometry(0.08, 0.9, 0.08), wood, 0, -0.35, 0);
      add(g, new THREE.SphereGeometry(0.09, 12, 10), bulbMat('#ffd9a0'), 0, -0.82, 0);
      break;
    }
    case 'e2055': {
      const holo = matColor('#8fd8ff', {
        emissive: '#8fd8ff',
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      });
      add(g, new THREE.SphereGeometry(0.16, 16, 14), holo, 0, -0.3, 0);
      add(g, new THREE.TorusGeometry(0.24, 0.015, 10, 30), holo, 0, -0.34, 0);
      break;
    }
  }
  return g;
}

/** Neon / glow signs on the back wall for 1985 and 2055. */
function buildWallGlow(group: THREE.Group, era: Era): void {
  if (era.id === 'e1985') {
    const neon = makeNeonTexture('CAFÉ', '#ff3da6');
    const material = new THREE.MeshStandardMaterial({
      map: neon,
      emissive: '#ff3da6',
      emissiveIntensity: 1.4,
      transparent: true,
    });
    add(group, new THREE.PlaneGeometry(2.4, 0.75), material, 0, 2.72, BACK_Z + 0.02);
  }
  if (era.id === 'e2055') {
    const neon = makeNeonTexture('BREW', '#7aa2ff');
    const material = new THREE.MeshStandardMaterial({
      map: neon,
      emissive: '#7aa2ff',
      emissiveIntensity: 1.5,
      transparent: true,
    });
    add(group, new THREE.PlaneGeometry(1.9, 0.6), material, 0, 2.72, BACK_Z + 0.02);
  }
}

/** Assemble every era-dependent decoration into one group. */
export function buildDecor(era: Era): THREE.Group {
  const g = new THREE.Group();
  g.name = `Decor:${era.id}`;

  buildPosters(g, era);
  buildClock(g);
  buildWallGlow(g, era);

  // menu board on the left wall
  const menu = new THREE.Group();
  menu.position.set(-4.55, 1.55, -5.55);
  menu.rotation.y = Math.PI / 2;
  buildMenuBoard(menu, era);
  g.add(menu);

  // espresso machine on the counter top (origin at counter top y=0.99)
  const machine = new THREE.Group();
  machine.position.set(0.1, 0.99, -4.75);
  buildEspressoMachine(machine, era);
  g.add(machine);

  // music device placement
  const device = buildMusicDevice(era);
  if (era.musicDeviceIndex === 1) {
    // jukebox on the floor, right side
    device.position.set(4.55, 0, -3.2);
    device.rotation.y = -Math.PI / 4;
  } else if (era.musicDeviceIndex === 0 || era.musicDeviceIndex === 5) {
    // radio / holo-player on the left wall shelf (shelf top at y=2.03)
    device.position.set(-2.6, 2.03, -5.8);
  } else if (era.musicDeviceIndex === 3 || era.musicDeviceIndex === 4) {
    // iPod dock / phone on the counter top
    device.position.set(0.1, 0.99, -4.55);
  } else {
    // boombox on a table (table top at y=0.81)
    device.position.set(2.2, 0.81, 2.6);
  }
  g.add(device);

  // wifi sign (2005 / 2025) on the right wall
  if (era.id === 'e2005' || era.id === 'e2025') {
    const ssid = era.id === 'e2025' ? 'WIFI: POUR-OVER' : 'WIFI: GROUNDS';
    const wifi = makeWifiTexture(ssid, era.id === 'e2025' ? '#2b6fae' : '#3f7fd4');
    const material = new THREE.MeshStandardMaterial({ map: wifi, emissive: '#ffffff', emissiveIntensity: 0.35 });
    const sign = add(g, new THREE.PlaneGeometry(1.5, 0.62), material, 4.96, 1.9, 0.6);
    sign.rotation.y = -Math.PI / 2;
  }

  // plant near the front window
  const plant = new THREE.Group();
  plant.position.set(2.6, 0, 3.4);
  buildPlant(plant, era.id === 'e2055');
  g.add(plant);

  // counter props
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.12, 18), matColor('#e8b46a', { roughness: 0.6 }));
  cake.position.set(-0.9, 1.05, -4.7);
  g.add(cake);
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.03, 18), matMetal('#b9b9b9', 0.35));
  tray.position.set(-1.9, 1.005, -4.6);
  g.add(tray);

  // tableware on each table
  for (const pos of TABLE_POSITIONS) {
    const ware = new THREE.Group();
    ware.position.set(pos.x, 0.81, pos.z);
    ware.rotation.y = pos.ry;
    buildTableware(ware, era);
    g.add(ware);
  }

  return g;
}

/** Convenience helper for menu items (kept for tests). */
export function menuPriceLines(items: MenuItem[]): string[] {
  return items.map((it) => `${it.item} · ${it.price}`);
}
