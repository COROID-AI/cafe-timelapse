import * as THREE from 'three';
import { matColor, matFabric, matEmit } from './materials';
import { TABLE_POSITIONS, chairSeatPositions } from './furniture';
import type { Era } from '../types';

/**
 * Stylized café patrons. The group origin sits on the seat (seated) or the
 * floor (standing), so placement can reuse the exact chair seat positions
 * shared with the furniture module. Outfits vary per era so the crowd reads
 * differently across the timelapse.
 */

interface PatronOutfit {
  torso: string;
  legs: string;
  skin: string;
  hair: string;
  accent: string;
}

const ERA_OUTFITS: Record<Era['id'], PatronOutfit[]> = {
  e1945: [
    { torso: '#4a3b2a', legs: '#3a2f24', skin: '#d9a47a', hair: '#2f2418', accent: '#8a5a3a' },
    { torso: '#6e5a45', legs: '#3a2f24', skin: '#c98d6a', hair: '#5a3a2a', accent: '#b3773f' },
    { torso: '#3f5f6e', legs: '#2f3a40', skin: '#d9a47a', hair: '#3a3a3a', accent: '#e8d8b8' },
  ],
  e1965: [
    { torso: '#2f3f5f', legs: '#232f47', skin: '#d9a47a', hair: '#1f1f1f', accent: '#c9a227' },
    { torso: '#8a3a3a', legs: '#5f2a2a', skin: '#c98d6a', hair: '#5a3a2a', accent: '#e3d5b4' },
    { torso: '#3f5f4a', legs: '#2f4737', skin: '#e0b08a', hair: '#3a2a1a', accent: '#f2e9d2' },
  ],
  e1985: [
    { torso: '#7a2f6e', legs: '#2a2140', skin: '#d9a47a', hair: '#1a1a2e', accent: '#ff3da6' },
    { torso: '#1f5f8a', legs: '#2a3a4a', skin: '#c98d6a', hair: '#3a3a3a', accent: '#29d9ff' },
    { torso: '#3a3a3a', legs: '#1f1f1f', skin: '#d9a47a', hair: '#8a5a2a', accent: '#ffd02e' },
  ],
  e2005: [
    { torso: '#5f3f7a', legs: '#2f2f4a', skin: '#d9a47a', hair: '#2a2a2a', accent: '#e3e3e3' },
    { torso: '#3f7f9e', legs: '#2f4a5f', skin: '#c98d6a', hair: '#5a3a1f', accent: '#8a5a2b' },
    { torso: '#6e8a3f', legs: '#3f4a2f', skin: '#e0b08a', hair: '#1f1f1f', accent: '#f5f5f5' },
  ],
  e2025: [
    { torso: '#2f2f2f', legs: '#1f1f1f', skin: '#d9a47a', hair: '#1f1f1f', accent: '#c2b29a' },
    { torso: '#c2b29a', legs: '#8a7a63', skin: '#c98d6a', hair: '#4a3320', accent: '#3f7d5c' },
    { torso: '#3f5f8a', legs: '#2f3f5f', skin: '#e0b08a', hair: '#2a2a2a', accent: '#f1ead9' },
  ],
  e2055: [
    { torso: '#dfe9ff', legs: '#b8c8e8', skin: '#cfe0f5', hair: '#8fb6e8', accent: '#8fd8ff' },
    { torso: '#8a7acf', legs: '#5f55a0', skin: '#d9cfe8', hair: '#b8a8e8', accent: '#7aa2ff' },
    { torso: '#3a4a6e', legs: '#2a3852', skin: '#d9e8f5', hair: '#c86bff', accent: '#6fb6ff' },
  ],
};

function add(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addHead(g: THREE.Group, outfit: PatronOutfit, era: Era, y: number): void {
  const skinMat = matColor(outfit.skin, { roughness: 0.7 });
  const hairMat = matColor(outfit.hair, { roughness: 0.85 });
  add(g, new THREE.SphereGeometry(0.14, 16, 12), skinMat, 0, y, 0);

  if (era.id === 'e1945') {
    // beret
    const beret = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), matColor(outfit.accent, { roughness: 0.8 }));
    beret.position.set(0, y + 0.12, 0);
    beret.scale.set(1, 0.4, 1);
    beret.castShadow = true;
    g.add(beret);
    return;
  }
  if (era.id === 'e1965') {
    // pillbox hat
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), matColor(outfit.accent, { roughness: 0.7 }));
    hat.position.set(0, y + 0.14, 0);
    hat.castShadow = true;
    g.add(hat);
    return;
  }

  // hair cap
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), hairMat);
  hair.position.set(0, y + 0.05, -0.01);
  hair.scale.set(1, 0.72, 1.05);
  hair.castShadow = true;
  g.add(hair);

  if (era.id === 'e2055') {
    // holo visor
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 0.04),
      matEmit('#8fd8ff', 1.2),
    );
    visor.position.set(0, y + 0.03, 0.12);
    g.add(visor);
  }
}

/** Seated patron; origin sits on the chair seat, facing local +z. */
function buildSeatedPatron(era: Era, variant: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Patron';
  const outfits = ERA_OUTFITS[era.id];
  const outfit = outfits[variant % outfits.length];
  const torsoMat = matFabric(outfit.torso);

  // torso (bottom sits on the seat, so the origin is the seat top)
  add(g, new THREE.BoxGeometry(0.34, 0.46, 0.22), torsoMat, 0, 0.23, 0);
  // arms resting toward the table
  add(g, new THREE.BoxGeometry(0.08, 0.38, 0.1), torsoMat, -0.23, 0.21, 0);
  add(g, new THREE.BoxGeometry(0.08, 0.38, 0.1), torsoMat, 0.23, 0.21, 0);
  // head
  addHead(g, outfit, era, 0.57);

  return g;
}

/** Standing patron; origin sits on the floor, facing local +z. */
function buildStandingPatron(era: Era, variant: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Patron';
  const outfits = ERA_OUTFITS[era.id];
  const outfit = outfits[variant % outfits.length];
  const torsoMat = matFabric(outfit.torso);
  const legMat = matColor(outfit.legs, { roughness: 0.85 });

  // legs
  add(g, new THREE.BoxGeometry(0.12, 0.72, 0.14), legMat, -0.1, 0.36, 0);
  add(g, new THREE.BoxGeometry(0.12, 0.72, 0.14), legMat, 0.1, 0.36, 0);
  // torso
  add(g, new THREE.BoxGeometry(0.36, 0.55, 0.22), torsoMat, 0, 0.98, 0);
  // arms
  add(g, new THREE.BoxGeometry(0.08, 0.5, 0.1), torsoMat, -0.24, 0.95, 0);
  add(g, new THREE.BoxGeometry(0.08, 0.5, 0.1), torsoMat, 0.24, 0.95, 0);
  // head
  addHead(g, outfit, era, 1.4);

  return g;
}

/** Counter stools: patrons face the counter at z = -4.6. */
const COUNTER_STOOLS: Array<{ x: number; z: number }> = [
  { x: -2.8, z: -3.9 },
  { x: -1.9, z: -3.9 },
];

/**
 * Build the era's patron group: seated guests at tables, counter stools, and
 * the bench, plus one standing guest near the door. Placement reuses the
 * exact chair seat positions from furniture.ts so patrons sit on the chairs.
 */
export function buildPatrons(era: Era): THREE.Group {
  const g = new THREE.Group();
  g.name = `Patrons:${era.id}`;

  // Guests per table (seated on the era's chairs)
  const tablePatrons = [2, 2, 1, 0];
  let variant = 0;
  TABLE_POSITIONS.forEach((t, ti) => {
    const seats = chairSeatPositions(era, t.x, t.z, t.ry);
    const count = Math.min(tablePatrons[ti] ?? 0, seats.length);
    for (let i = 0; i < count; i++) {
      const seat = seats[i];
      const patron = buildSeatedPatron(era, variant);
      patron.position.set(seat.x, seat.y, seat.z);
      patron.rotation.y = seat.ry;
      g.add(patron);
      variant++;
    }
  });

  // Counter stools (stool seat top at y=0.815)
  for (const stool of COUNTER_STOOLS) {
    const patron = buildSeatedPatron(era, variant);
    patron.position.set(stool.x, 0.815, stool.z);
    patron.rotation.y = Math.PI; // face the counter (toward -z)
    g.add(patron);
    variant++;
  }

  // Bench guest (bench seat top at y=0.565, facing into the room toward +x)
  const bench = buildSeatedPatron(era, variant);
  bench.position.set(-3.85, 0.565, 1.6);
  bench.rotation.y = Math.PI / 2;
  g.add(bench);
  variant++;

  // Standing guest near the door on the right wall (facing into the room).
  // Kept clear of the ajar door (inner edge swings to ~x 4.29, z -1.1).
  const standing = buildStandingPatron(era, variant);
  standing.position.set(4.15, 0, -0.5);
  standing.rotation.y = -Math.PI / 2;
  g.add(standing);

  return g;
}
