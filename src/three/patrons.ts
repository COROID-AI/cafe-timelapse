import * as THREE from 'three';
import { matColor, matFabric, matEmit } from './materials';
import { TABLE_POSITIONS, chairSeatPositions } from './furniture';
import type { Era } from '../types';

/**
 * Stylized café patrons. The group origin sits on the seat (seated) or the
 * floor (standing), so placement can reuse the exact chair seat positions
 * shared with the furniture module. Outfits vary per era so the crowd reads
 * differently across the timelapse.
 *
 * Visibility notes: chairs closest to the front of the café (largest world z,
 * facing the room/camera) are filled first so seated guests read clearly from
 * the default overview; the second guest at a table is turned toward the first
 * (conversation pose) so both figures stay visible instead of hiding behind a
 * chair back.
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
    { torso: '#6b5038', legs: '#4a3a2a', skin: '#e2ac80', hair: '#3a2a18', accent: '#c98a4e' },
    { torso: '#8a6a4a', legs: '#5a4630', skin: '#d9a47a', hair: '#6b4a30', accent: '#d8a05a' },
    { torso: '#5a7a6e', legs: '#3f5a52', skin: '#e2ac80', hair: '#4a4a4a', accent: '#f0e0c0' },
  ],
  e1965: [
    { torso: '#3f5f9e', legs: '#2f3f6e', skin: '#e2ac80', hair: '#2f2f2f', accent: '#ffd24d' },
    { torso: '#c75b4a', legs: '#8a3f33', skin: '#d9a47a', hair: '#6b4a30', accent: '#f2e5c8' },
    { torso: '#5a8a5f', legs: '#3f6b44', skin: '#eab88f', hair: '#4a3220', accent: '#f8f0d8' },
  ],
  e1985: [
    { torso: '#b34d9e', legs: '#3f3060', skin: '#e2ac80', hair: '#2a2a3f', accent: '#ff5fd0' },
    { torso: '#2f8fd0', legs: '#3f5a7a', skin: '#d9a47a', hair: '#4a4a4a', accent: '#40e0ff' },
    { torso: '#e8e8e8', legs: '#8a8a8a', skin: '#e2ac80', hair: '#c8863a', accent: '#ffd02e' },
  ],
  e2005: [
    { torso: '#8a5fc0', legs: '#4a3f7a', skin: '#e2ac80', hair: '#3f3f3f', accent: '#f2f2f2' },
    { torso: '#5fa8d0', legs: '#3f6b8a', skin: '#d9a47a', hair: '#7a5a30', accent: '#c98a4e' },
    { torso: '#a0c05f', legs: '#5f7a3f', skin: '#eab88f', hair: '#2f2f2f', accent: '#ffffff' },
  ],
  e2025: [
    { torso: '#e8e2d4', legs: '#8a8070', skin: '#e2ac80', hair: '#4a3f33', accent: '#5f9e7a' },
    { torso: '#4a7fd0', legs: '#2f4a7a', skin: '#d9a47a', hair: '#3a2f24', accent: '#f2e5c8' },
    { torso: '#d98a4a', legs: '#8a5a2f', skin: '#eab88f', hair: '#2f2f2f', accent: '#4a7fd0' },
  ],
  e2055: [
    { torso: '#e8f0ff', legs: '#b8c8e8', skin: '#d8e4f5', hair: '#8fb6e8', accent: '#8fd8ff' },
    { torso: '#9a8ae8', legs: '#6a5fb0', skin: '#e0d8f0', hair: '#c0b0f0', accent: '#8fa8ff' },
    { torso: '#5a7ac0', legs: '#3f5585', skin: '#e0e8f5', hair: '#d8a0ff', accent: '#7fb8ff' },
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

/** Guests per table, seated on chairs that face the room first. */
const TABLE_PATRONS = [2, 2, 2, 2];

/**
 * Build the era's patron group: seated guests at tables, counter stools, the
 * bench, a barista behind the counter, and standing guests near the door and
 * the front window. Table chairs closest to the front (largest world z) are
 * filled first so guests are visible from the default overview; the partner
 * chair is turned toward the first guest so both figures stay readable.
 */
export function buildPatrons(era: Era): THREE.Group {
  const g = new THREE.Group();
  g.name = `Patrons:${era.id}`;

  let variant = 0;

  // Seated guests at the tables
  TABLE_POSITIONS.forEach((t, ti) => {
    const seats = chairSeatPositions(era, t.x, t.z, t.ry);
    // Front-facing chairs (closest to the camera side) first.
    const ordered = [...seats].sort((a, b) => b.z - a.z);
    const count = Math.min(TABLE_PATRONS[ti] ?? 0, ordered.length);
    for (let i = 0; i < count; i++) {
      const seat = ordered[i];
      const patron = buildSeatedPatron(era, variant);
      patron.position.set(seat.x, seat.y, seat.z);
      if (i === 0) {
        patron.rotation.y = seat.ry;
      } else {
        // Turn toward the first guest (conversation pose) so both patrons
        // face the room instead of hiding behind a chair back.
        patron.rotation.y = Math.atan2(ordered[0].x - seat.x, ordered[0].z - seat.z);
      }
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

  // Barista behind the counter (torso/head rise above the counter top).
  const barista = buildStandingPatron(era, variant);
  barista.position.set(-1.4, 0, -5.15);
  barista.rotation.y = 0; // face +z toward the counter
  g.add(barista);
  variant++;

  // Standing guests near the front, facing into the room (toward the default
  // camera) so the crowd is clearly visible from the overview. Kept clear of
  // the table discs and chair arcs.
  const frontSpots = [
    { x: -3.2, z: 4.9, ry: 0 },
    { x: 3.4, z: 3.9, ry: -0.35 },
  ];
  for (const spot of frontSpots) {
    const patron = buildStandingPatron(era, variant);
    patron.position.set(spot.x, 0, spot.z);
    patron.rotation.y = spot.ry;
    g.add(patron);
    variant++;
  }

  // Standing guest near the door on the right wall (facing into the room).
  // Kept clear of the ajar door (inner edge swings to ~x 4.29, z -1.1).
  const standing = buildStandingPatron(era, variant);
  standing.position.set(4.15, 0, -0.5);
  standing.rotation.y = -Math.PI / 2;
  g.add(standing);

  return g;
}
