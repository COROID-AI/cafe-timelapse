import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// Era Configuration
// ============================================================
const ERAS = [
  { year: 1945, label: 'Post-War Café', colorTemp: 2700, musicStyle: 'jazz', ambient: 0.6 },
  { year: 1965, label: 'Swinging Sixties', colorTemp: 3200, musicStyle: 'motown', ambient: 0.7 },
  { year: 1985, label: 'Synthwave Café', colorTemp: 3500, musicStyle: 'synthpop', ambient: 0.8 },
  { year: 2005, label: 'Digital Age', colorTemp: 4000, musicStyle: 'indie', ambient: 0.75 },
  { year: 2025, label: 'Modern Artisan', colorTemp: 3800, musicStyle: 'lo-fi', ambient: 0.7 },
  { year: 2055, label: 'Neo-Café', colorTemp: 5000, musicStyle: 'ambient', ambient: 0.85 },
];

// ============================================================
// Global State
// ============================================================
let scene, camera, renderer, controls;
let caféGroup, lightingGroup, decorGroup;
let currentEra = 0;
let targetEra = 0;
let transitionProgress = 1;
let transitionDuration = 1.5;
let transitionStart = 0;
let animationPaused = false;
let sfxEnabled = true;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let hoveredObject = null;

// Audio context
let audioCtx = null;
let audioNodes = {};
let currentMusicGain = null;

// Shared geometries and materials for reuse (performance)
const sharedGeo = {};
const sharedMat = {};

// ============================================================
// Performance: shared geometry/material cache
// ============================================================
function initSharedResources() {
  sharedGeo.box = new THREE.BoxGeometry(1, 1, 1);
  sharedGeo.cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
  sharedGeo.sphere = new THREE.SphereGeometry(0.5, 16, 16);
  sharedGeo.cone = new THREE.ConeGeometry(0.5, 1, 16);
  sharedGeo.torus = new THREE.TorusGeometry(0.5, 0.15, 8, 24);
  sharedGeo.plane = new THREE.PlaneGeometry(1, 1);
  sharedGeo.circle = new THREE.CircleGeometry(0.5, 24);
  sharedGeo.disc = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24);
  sharedGeo.tube = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.2, 0.3, 0),
      new THREE.Vector3(0.1, 0.6, 0),
      new THREE.Vector3(0, 0.8, 0),
    ]), 12, 0.03, 8, false);
  sharedGeo.spoon = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, 0.3, 0.05),
      new THREE.Vector3(0, 0.5, 0.1),
      new THREE.Vector3(-0.1, 0.7, 0.05),
    ]), 8, 0.015, 6, false);
  sharedGeo.cup = new THREE.CylinderGeometry(0.06, 0.05, 0.12, 16);
  sharedGeo.plate = new THREE.CylinderGeometry(0.08, 0.08, 0.015, 24);
  sharedGeo.mug = new THREE.CylinderGeometry(0.05, 0.045, 0.1, 16);
  sharedGeo.tableTop = new THREE.CylinderGeometry(0.6, 0.6, 0.04, 32);
  sharedGeo.tableLeg = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8);
  sharedGeo.barTop = new THREE.BoxGeometry(2, 0.04, 0.8);
  sharedGeo.menuBoard = new THREE.BoxGeometry(1.2, 0.8, 0.03);
  sharedGeo.frame = new THREE.BoxGeometry(1.3, 0.9, 0.02);
  sharedGeo.screen = new THREE.BoxGeometry(0.6, 0.4, 0.01);
  sharedGeo.phone = new THREE.BoxGeometry(0.08, 0.14, 0.01);
  sharedGeo.wireless = new THREE.BoxGeometry(0.12, 0.06, 0.12);
  sharedGeo.jukeboxBody = new THREE.BoxGeometry(0.6, 1.2, 0.5);
  sharedGeo.boombox = new THREE.BoxGeometry(0.3, 0.15, 0.2);
  sharedGeo.ipod = new THREE.BoxGeometry(0.04, 0.06, 0.01);
  sharedGeo.coffeemachine = new THREE.BoxGeometry(0.4, 0.6, 0.4);
  sharedGeo.grinder = new THREE.BoxGeometry(0.2, 0.25, 0.2);
  sharedGeo.pedistal = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
  sharedGeo.till = new THREE.BoxGeometry(0.5, 0.6, 0.3);
  sharedGeo.chairSeat = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16);
  sharedGeo.chairBack = new THREE.BoxGeometry(0.22, 0.45, 0.04);
  sharedGeo.chairLeg = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6);
  sharedGeo.stoolSeat = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16);
  sharedGeo.stoolLeg = new THREE.CylinderGeometry(0.01, 0.01, 0.55, 6);
  sharedGeo.poster = new THREE.PlaneGeometry(0.5, 0.7);
  sharedGeo.bottle = new THREE.CylinderGeometry(0.02, 0.025, 0.15, 8);
  sharedGeo.vinyl = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32);
  sharedGeo.lightbulb = new THREE.SphereGeometry(0.06, 12, 12);
  sharedGeo.lampshade = new THREE.ConeGeometry(0.12, 0.15, 12, 1, true);
  sharedGeo.neon = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0), new THREE.Vector3(0.3,0.2,0), new THREE.Vector3(0.5,0,0)]),
    10, 0.008, 6, false);
  sharedGeo.pastry = new THREE.SphereGeometry(0.04, 8, 8);
  sharedGeo.croissant = new THREE.BoxGeometry(0.06, 0.02, 0.12);
  sharedGeo.sandwich = new THREE.BoxGeometry(0.08, 0.03, 0.1);
  sharedGeo.book = new THREE.BoxGeometry(0.08, 0.12, 0.04);
  sharedGeo.newspaper = new THREE.BoxGeometry(0.15, 0.005, 0.1);
  sharedGeo.hat = new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  sharedGeo.hairstyle = new THREE.SphereGeometry(0.06, 8, 8);
  sharedGeo.glasses = new THREE.TorusGeometry(0.05, 0.008, 8, 16);
  sharedGeo.tie = new THREE.BoxGeometry(0.015, 0.15, 0.01);
  sharedGeo.bowtie = new THREE.BoxGeometry(0.04, 0.015, 0.04);
  sharedGeo.waistcoat = new THREE.BoxGeometry(0.35, 0.5, 0.15);
  sharedGeo.dress = new THREE.BoxGeometry(0.3, 0.6, 0.12);
  sharedGeo.jacket = new THREE.BoxGeometry(0.4, 0.5, 0.15);
  sharedGeo.skirt = new THREE.BoxGeometry(0.35, 0.4, 0.1);
}

function getMaterial(key, params) {
  const matKey = key + '_' + JSON.stringify(params);
  if (!sharedMat[matKey]) {
    sharedMat[matKey] = new THREE.MeshStandardMaterial(params);
  }
  return sharedMat[matKey];
}

// ============================================================
// Scene Setup
// ============================================================
function initScene() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.015);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(5, 4, 7);
  camera.lookAt(0, 1, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 1, 0);
  controls.minDistance = 2;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minPolarAngle = 0.3;
  controls.update();

  renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);

  window.addEventListener('resize', onResize);
}

function onContextLost(e) {
  e.preventDefault();
  console.warn('WebGL context lost.');
}

function onContextRestored() {
  console.log('WebGL context restored.');
  initRendererState();
}

function initRendererState() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================
// Lighting System
// ============================================================
function createLighting() {
  lightingGroup = new THREE.Group();
  scene.add(lightingGroup);

  const ambient = new THREE.AmbientLight(0x404060, 0.3);
  lightingGroup.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffeedd, 0x223344, 0.4);
  lightingGroup.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xfff0d0, 1.5);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 30;
  dirLight.shadow.camera.left = -10;
  dirLight.shadow.camera.right = 10;
  dirLight.shadow.camera.top = 10;
  dirLight.shadow.camera.bottom = -10;
  dirLight.shadow.bias = -0.001;
  lightingGroup.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8899cc, 0.4);
  fillLight.position.set(-3, 4, -3);
  lightingGroup.add(fillLight);

  const point1 = new THREE.PointLight(0xffaa55, 1, 15);
  point1.position.set(0, 3, 0);
  lightingGroup.add(point1);

  const point2 = new THREE.PointLight(0xffcc88, 0.6, 10);
  point2.position.set(-3, 2.5, 3);
  lightingGroup.add(point2);

  const point3 = new THREE.PointLight(0xff8844, 0.4, 8);
  point3.position.set(3, 2, -2);
  lightingGroup.add(point3);
}

function updateLightingForEra(eraIndex, progress) {
  const prevEra = ERAS[Math.max(0, eraIndex - 1)] || ERAS[0];
  const nextEra = ERAS[Math.min(ERAS.length - 1, eraIndex)] || ERAS[0];
  const t = progress;

  const tempPrev = prevEra.colorTemp;
  const tempNext = nextEra.colorTemp;
  const temp = tempPrev + (tempNext - tempPrev) * t;

  const color = new THREE.Color();
  if (temp < 3000) {
    color.setRGB(1.0, 0.85, 0.6);
  } else if (temp < 4000) {
    color.setRGB(1.0, 0.92, 0.75);
  } else if (temp < 5000) {
    color.setRGB(1.0, 0.95, 0.85);
  } else {
    color.setRGB(1.0, 0.98, 0.95);
  }

  lightingGroup.children.forEach(light => {
    if (light.isDirectionalLight && light.position.y > 3) {
      light.color.copy(color);
    }
  });
}

// ============================================================
// Café Structure
// ============================================================
function createCafé() {
  caféGroup = new THREE.Group();
  scene.add(caféGroup);

  decorGroup = new THREE.Group();
  caféGroup.add(decorGroup);

  // Floor
  const floorGeo = new THREE.BoxGeometry(14, 0.05, 14);
  const floorMat = getMaterial('floor', { color: 0x2a2a2a, roughness: 0.7, metalness: 0.1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = 0;
  floor.receiveShadow = true;
  caféGroup.add(floor);

  // Floor tile lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
  for (let i = -6; i <= 6; i += 2) {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0.026, -7),
      new THREE.Vector3(i, 0.026, 7)
    ]);
    caféGroup.add(new THREE.Line(lineGeo, lineMat));
    const hLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-7, 0.026, i),
      new THREE.Vector3(7, 0.026, i)
    ]);
    caféGroup.add(new THREE.Line(hLineGeo, lineMat));
  }

  // Walls
  const wallMat = getMaterial('wall', { color: 0x3a3530, roughness: 0.9, metalness: 0.0 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 0.1), wallMat);
  backWall.position.set(0, 2.5, -7);
  caféGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 14), wallMat);
  leftWall.position.set(-7, 2.5, 0);
  caféGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 14), wallMat);
  rightWall.position.set(7, 2.5, 0);
  caféGroup.add(rightWall);

  // Ceiling
  const ceilingMat = getMaterial('ceiling', { color: 0x1a1a1a, roughness: 0.8, metalness: 0.0 });
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(14, 0.05, 14), ceilingMat);
  ceiling.position.y = 5;
  caféGroup.add(ceiling);

  // Counter
  const counterGroup = new THREE.Group();
  const counterMat = getMaterial('counter', { color: 0x5a4a3a, roughness: 0.4, metalness: 0.3 });
  const counterTop = new THREE.Mesh(sharedGeo.barTop, counterMat);
  counterTop.position.y = 1.05;
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  counterGroup.add(counterTop);

  const counterFront = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 0.1), counterMat);
  counterFront.position.set(0, 0.5, 0.4);
  counterFront.castShadow = true;
  counterGroup.add(counterFront);

  const counterSideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.8), counterMat);
  counterSideL.position.set(-1, 0.5, 0);
  counterGroup.add(counterSideL);

  const counterSideR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.8), counterMat);
  counterSideR.position.set(1, 0.5, 0);
  counterGroup.add(counterSideR);

  for (let x = -0.9; x <= 0.9; x += 0.6) {
    for (let z = 0.2; z <= 0.6; z += 0.4) {
      const leg = new THREE.Mesh(sharedGeo.pedistal, counterMat);
      leg.position.set(x, 0.36, z);
      counterGroup.add(leg);
    }
  }

  counterGroup.position.set(0, 0, 0.5);
  caféGroup.add(counterGroup);

  createTables();
  createChairs();
  createBaseDecor();
  createLightFixtures();
}

function createTables() {
  const tableMat = getMaterial('table', { color: 0x6b4226, roughness: 0.5, metalness: 0.2 });
  const tableGroup = new THREE.Group();

  const centralTable = new THREE.Group();
  const top = new THREE.Mesh(sharedGeo.tableTop, tableMat);
  top.position.y = 0.75;
  top.castShadow = true;
  centralTable.add(top);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const leg = new THREE.Mesh(sharedGeo.tableLeg, tableMat);
    leg.position.set(Math.cos(angle) * 0.48, 0.36, Math.sin(angle) * 0.48);
    centralTable.add(leg);
  }
  centralTable.position.set(0, 0, -2);
  tableGroup.add(centralTable);

  const smallTableMat = getMaterial('tableSmall', { color: 0x5a3a20, roughness: 0.6, metalness: 0.15 });
  const positions = [
    [-2.5, 0, -1], [-2.5, 0, -3], [2.5, 0, -1], [2.5, 0, -3],
    [-2, 0, 1], [2, 0, 1], [-3, 0, 3], [3, 0, 3]
  ];
  positions.forEach(pos => {
    const t = new THREE.Group();
    const st = new THREE.Mesh(sharedGeo.tableTop, smallTableMat);
    st.scale.set(0.7, 1, 0.7);
    st.position.y = 0.7;
    st.castShadow = true;
    t.add(st);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + 0.5;
      const leg = new THREE.Mesh(sharedGeo.tableLeg, smallTableMat);
      leg.position.set(Math.cos(angle) * 0.3, 0.35, Math.sin(angle) * 0.3);
      t.add(leg);
    }
    t.position.set(pos[0], pos[1], pos[2]);
    tableGroup.add(t);
  });

  caféGroup.add(tableGroup);
}

function createChairs() {
  const chairMat = getMaterial('chair', { color: 0x4a3a2a, roughness: 0.6, metalness: 0.1 });
  const chairGroup = new THREE.Group();

  const chairPositions = [
    [-2.5, 0, -1.3], [-2.5, 0, -2.7], [2.5, 0, -1.3], [2.5, 0, -2.7],
    [-2, 0, 0.7], [2, 0, 0.7], [-3, 0, 2.7], [3, 0, 2.7]
  ];
  chairPositions.forEach(pos => {
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(sharedGeo.chairSeat, chairMat);
    seat.position.y = 0.42;
    seat.castShadow = true;
    chair.add(seat);
    const back = new THREE.Mesh(sharedGeo.chairBack, chairMat);
    back.position.set(0, 0.65, -0.08);
    back.castShadow = true;
    chair.add(back);
    for (let i = 0; i < 4; i++) {
      const lx = (i < 2 ? -0.08 : 0.08);
      const lz = (i % 2 === 0 ? 0.08 : -0.08);
      const leg = new THREE.Mesh(sharedGeo.chairLeg, chairMat);
      leg.position.set(lx, 0.2, lz);
      chair.add(leg);
    }
    chair.position.set(pos[0], pos[1], pos[2]);
    chair.rotation.y = Math.random() * Math.PI;
    chairGroup.add(chair);
  });

  caféGroup.add(chairGroup);
}

function createBaseDecor() {
  const shelfMat = getMaterial('shelf', { color: 0x5a4030, roughness: 0.7, metalness: 0.1 });
  for (let i = 0; i < 5; i++) {
    const shelf = new THREE.Mesh(sharedGeo.plane, shelfMat);
    shelf.rotation.x = -Math.PI / 2;
    shelf.scale.set(3, 3, 1);
    shelf.position.set(-3 + i * 1.5, 2.5, -6.9);
    decorGroup.add(shelf);
  }

  const menuMat = getMaterial('menuBoard', { color: 0x8a7a60, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
  const menuBoard = new THREE.Mesh(sharedGeo.menuBoard, menuMat);
  menuBoard.position.set(0, 2.5, -6.95);
  decorGroup.add(menuBoard);

  const frameMat = getMaterial('frame', { color: 0x4a3a2a, roughness: 0.5, metalness: 0.3 });
  const menuFrame = new THREE.Mesh(sharedGeo.frame, frameMat);
  menuFrame.position.set(0, 2.5, -6.94);
  decorGroup.add(menuFrame);
}

function createLightFixtures() {
  const fixtureGroup = new THREE.Group();

  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 3;
    const fixture = new THREE.Group();
    const cord = new THREE.Mesh(sharedGeo.tube, getMaterial('cord', { color: 0x222222, roughness: 0.8 }));
    fixture.add(cord);
    const shade = new THREE.Mesh(sharedGeo.lampshade, getMaterial('shade', { color: 0x8a7a60, roughness: 0.6, side: THREE.DoubleSide }));
    shade.position.y = -0.15;
    fixture.add(shade);
    const bulb = new THREE.Mesh(sharedGeo.lightbulb, getMaterial('bulb', { color: 0xffeecc, emissive: 0xffcc66, emissiveIntensity: 0.8 }));
    bulb.position.y = -0.3;
    fixture.add(bulb);

    const pl = new THREE.PointLight(0xffcc88, 0.8, 6);
    pl.position.y = -0.3;
    fixture.add(pl);

    fixture.position.set(x, 4.8, 0);
    fixtureGroup.add(fixture);
  }

  caféGroup.add(fixtureGroup);
}

// ============================================================
// Era-Specific Decor
// ============================================================
function clearEraDecor() {
  while (decorGroup.children.length > 0) {
    const child = decorGroup.children[0];
    decorGroup.remove(child);
    if (child.geometry && !Object.values(sharedGeo).includes(child.geometry)) {
      child.geometry.dispose();
    }
  }
}

function createEraDecor(eraIndex, progress) {
  clearEraDecor();

  switch (eraIndex) {
    case 0: create1945Decor(); break;
    case 1: create1965Decor(); break;
    case 2: create1985Decor(); break;
    case 3: create2005Decor(); break;
    case 4: create2025Decor(); break;
    case 5: create2055Decor(); break;
  }
}

function create1945Decor() {
  const radioMat = getMaterial('radio1945', { color: 0x3a3a3a, roughness: 0.5, metalness: 0.6 });
  const radio = new THREE.Mesh(sharedGeo.box, radioMat);
  radio.scale.set(0.3, 0.2, 0.15);
  radio.position.set(-2.5, 1.0, -1);
  radio.rotation.y = 0.3;
  decorGroup.add(radio);

  const posterMat = getMaterial('poster1945', { color: 0xeeddcc, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 2; i++) {
    const poster = new THREE.Mesh(sharedGeo.poster, posterMat);
    poster.position.set(-4 + i * 2, 2.8, -6.96);
    poster.rotation.y = 0.1 * (i === 0 ? 1 : -1);
    decorGroup.add(poster);
  }

  const vinylMat = getMaterial('vinyl1945', { color: 0x1a1a2e, roughness: 0.3, metalness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const record = new THREE.Mesh(sharedGeo.vinyl, vinylMat);
    record.position.set(-3.5 + i * 0.3, 2.55, -6.8);
    record.rotation.x = -Math.PI / 2;
    decorGroup.add(record);
  }

  const grinderMat = getMaterial('grinder1945', { color: 0x4a4a4a, roughness: 0.4, metalness: 0.5 });
  const grinder = new THREE.Mesh(sharedGeo.grinder, grinderMat);
  grinder.position.set(1.5, 0.55, 0.3);
  decorGroup.add(grinder);

  const tillMat = getMaterial('till1945', { color: 0x3a3a3a, roughness: 0.3, metalness: 0.6 });
  const till = new THREE.Mesh(sharedGeo.till, tillMat);
  till.position.set(-0.5, 0.8, 0.5);
  decorGroup.add(till);

  const bottleMat = getMaterial('bottle1945', { color: 0x2a3a5a, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 4; i++) {
    const bottle = new THREE.Mesh(sharedGeo.bottle, bottleMat);
    bottle.position.set(-0.6 + i * 0.15, 1.1, 0.2);
    decorGroup.add(bottle);
  }

  const adMat = getMaterial('ad1945', { color: 0xf0e8d8, roughness: 0.9, side: THREE.DoubleSide });
  const ad = new THREE.Mesh(sharedGeo.poster, adMat);
  ad.position.set(3.5, 2.8, -6.96);
  decorGroup.add(ad);

  const oldLampMat = getMaterial('oldLamp', { color: 0x886644, roughness: 0.5, metalness: 0.3 });
  const oldLamp = new THREE.Mesh(sharedGeo.lampshade, oldLampMat);
  oldLamp.position.set(-2, 4.7, -1);
  decorGroup.add(oldLamp);
}

function create1965Decor() {
  const popArtMat = getMaterial('popArt', { color: 0xff4444, roughness: 0.8, side: THREE.DoubleSide });
  const popArt = new THREE.Mesh(sharedGeo.poster, popArtMat);
  popArt.position.set(0, 2.8, -6.96);
  decorGroup.add(popArt);

  const orangeMat = getMaterial('orange1965', { color: 0xcc6633, roughness: 0.4, metalness: 0.1 });
  const orangeChair = new THREE.Mesh(sharedGeo.chairSeat, orangeMat);
  orangeChair.position.set(3, 0.45, -1);
  decorGroup.add(orangeChair);

  const turntableMat = getMaterial('turntable', { color: 0x3a2a1a, roughness: 0.5, metalness: 0.3 });
  const turntable = new THREE.Mesh(sharedGeo.disc, turntableMat);
  turntable.scale.set(1.5, 1, 1.5);
  turntable.position.set(-2, 0.8, -3);
  decorGroup.add(turntable);

  const jukeboxMat = getMaterial('jukebox1965', { color: 0xcc3333, roughness: 0.4, metalness: 0.3 });
  const jukebox = new THREE.Mesh(sharedGeo.jukeboxBody, jukeboxMat);
  jukebox.position.set(3.5, 0.7, -1);
  decorGroup.add(jukebox);

  const jScreenMat = getMaterial('jScreen', { color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.3 });
  const jScreen = new THREE.Mesh(sharedGeo.screen, jScreenMat);
  jScreen.position.set(3.5, 1.0, -0.74);
  decorGroup.add(jScreen);

  const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
  colors.forEach((c, i) => {
    const recMat = getMaterial('vinyl65_' + i, { color: c, roughness: 0.3, metalness: 0.4 });
    const rec = new THREE.Mesh(sharedGeo.vinyl, recMat);
    rec.position.set(-3.5 + i * 0.3, 2.55, -6.8);
    rec.rotation.x = -Math.PI / 2;
    decorGroup.add(rec);
  });

  const neonMat = getMaterial('neon65', { color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 1.0 });
  const neon = new THREE.Mesh(sharedGeo.neon, neonMat);
  neon.position.set(1, 3.5, -6.95);
  decorGroup.add(neon);

  const boomboxMat = getMaterial('boombox1965', { color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 });
  const boombox = new THREE.Mesh(sharedGeo.boombox, boomboxMat);
  boombox.position.set(-3, 0.6, 2);
  decorGroup.add(boombox);
}

function create1985Decor() {
  const gridMat = getMaterial('grid85', { color: 0x2a0a3a, roughness: 0.7, side: THREE.DoubleSide });
  const grid = new THREE.Mesh(sharedGeo.poster, gridMat);
  grid.position.set(-3, 2.8, -6.96);
  decorGroup.add(grid);

  const neonBlueMat = getMaterial('neon85b', { color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.2 });
  const neonBlue = new THREE.Mesh(sharedGeo.neon, neonBlueMat);
  neonBlue.position.set(2, 3.2, -6.95);
  decorGroup.add(neonBlue);

  const neonPinkMat = getMaterial('neon85p', { color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1.2 });
  const neonPink = new THREE.Mesh(sharedGeo.neon, neonPinkMat);
  neonPink.position.set(0, 3.8, -6.95);
  decorGroup.add(neonPink);

  const boomboxMat = getMaterial('boombox85', { color: 0x1a1a3a, roughness: 0.3, metalness: 0.4 });
  const boombox = new THREE.Mesh(sharedGeo.boombox, boomboxMat);
  boombox.position.set(3, 0.5, 1.5);
  decorGroup.add(boombox);

  const tvMat = getMaterial('tv85', { color: 0x1a1a1a, roughness: 0.2, metalness: 0.5 });
  const tv = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), tvMat);
  tv.position.set(0.3, 1.1, 0.3);
  decorGroup.add(tv);

  const screenMat = getMaterial('tvScreen85', { color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 });
  const screen = new THREE.Mesh(sharedGeo.screen, screenMat);
  screen.position.set(0.3, 1.1, 0.33);
  decorGroup.add(screen);

  const deloreanMat = getMaterial('delorean85', { color: 0x8888aa, roughness: 0.7, side: THREE.DoubleSide });
  const delorean = new THREE.Mesh(sharedGeo.poster, deloreanMat);
  delorean.position.set(3.5, 2.8, -6.96);
  decorGroup.add(delorean);

  const synthLampMat = getMaterial('synthLamp', { color: 0x6600cc, emissive: 0x6600cc, emissiveIntensity: 0.6 });
  const synthLamp = new THREE.Mesh(sharedGeo.lightbulb, synthLampMat);
  synthLamp.position.set(-1, 4.5, -1);
  decorGroup.add(synthLamp);

  const cassetteMat = getMaterial('cassette85', { color: 0xdd2222, roughness: 0.5, metalness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const cassette = new THREE.Mesh(sharedGeo.book, cassetteMat);
    cassette.position.set(-3.5 + i * 0.25, 2.55, -6.8);
    decorGroup.add(cassette);
  }
}

function create2005Decor() {
  const ipodMat = getMaterial('ipod05', { color: 0x222222, roughness: 0.3, metalness: 0.6 });
  const ipod = new THREE.Mesh(sharedGeo.ipod, ipodMat);
  ipod.position.set(-2.5, 0.85, -0.5);
  ipod.rotation.z = 0.3;
  decorGroup.add(ipod);

  const laptopMat = getMaterial('laptop05', { color: 0x1a1a2a, roughness: 0.3, metalness: 0.4 });
  const laptop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.3), laptopMat);
  laptop.position.set(-2, 0.78, -1.8);
  decorGroup.add(laptop);

  const routerMat = getMaterial('router05', { color: 0x333333, roughness: 0.5, metalness: 0.3 });
  const router = new THREE.Mesh(sharedGeo.wireless, routerMat);
  router.position.set(2.5, 0.9, 0);
  decorGroup.add(router);

  const digiMenuMat = getMaterial('digiMenu', { color: 0x1a3a1a, emissive: 0x00ff44, emissiveIntensity: 0.3 });
  const digiMenu = new THREE.Mesh(sharedGeo.menuBoard, digiMenuMat);
  digiMenu.position.set(0, 2.5, -6.95);
  decorGroup.add(digiMenu);

  const lcdMat = getMaterial('lcd05', { color: 0x111111, roughness: 0.2, metalness: 0.5 });
  const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.04), lcdMat);
  lcd.position.set(0.5, 1.15, 0.3);
  decorGroup.add(lcd);

  const canMat = getMaterial('can05', { color: 0x00aaff, roughness: 0.3, metalness: 0.4 });
  const can = new THREE.Mesh(sharedGeo.bottle, canMat);
  can.scale.set(0.7, 1.5, 0.7);
  can.position.set(-0.5, 1.05, -1.5);
  decorGroup.add(can);

  const cup2005Mat = getMaterial('cup05', { color: 0xffffff, roughness: 0.6, metalness: 0.0 });
  const cup2005 = new THREE.Mesh(sharedGeo.cup, cup2005Mat);
  cup2005.position.set(0.5, 1.08, 0.2);
  decorGroup.add(cup2005);

  const phoneMat = getMaterial('phone05', { color: 0x111111, roughness: 0.2, metalness: 0.5 });
  const phone = new THREE.Mesh(sharedGeo.phone, phoneMat);
  phone.position.set(-0.3, 0.78, -1.3);
  decorGroup.add(phone);

  const earbudMat = getMaterial('earbud05', { color: 0x333333, roughness: 0.4, metalness: 0.3 });
  const earbud = new THREE.Mesh(sharedGeo.wireless, earbudMat);
  earbud.position.set(1.5, 0.77, -1.5);
  decorGroup.add(earbud);
}

function create2025Decor() {
  const espressoMat = getMaterial('espresso25', { color: 0x2a2a2a, roughness: 0.2, metalness: 0.7 });
  const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), espressoMat);
  espresso.position.set(0.8, 0.7, 0.2);
  decorGroup.add(espresso);

  const steamMat = getMaterial('steam25', { color: 0x888888, roughness: 0.3, metalness: 0.6 });
  const steam = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8), steamMat);
  steam.position.set(1.0, 1.0, 0.2);
  decorGroup.add(steam);

  const ipadMat = getMaterial('ipad25', { color: 0x111111, roughness: 0.2, metalness: 0.5 });
  const ipad = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.015), ipadMat);
  ipad.position.set(-0.3, 1.1, 0.3);
  decorGroup.add(ipad);

  const terminalMat = getMaterial('terminal25', { color: 0x333333, roughness: 0.3, metalness: 0.5 });
  const terminal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.2), terminalMat);
  terminal.position.set(0.5, 0.8, 0.5);
  decorGroup.add(terminal);

  const tScreenMat = getMaterial('tScreen25', { color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.4 });
  const tScreen = new THREE.Mesh(sharedGeo.screen, tScreenMat);
  tScreen.scale.set(0.5, 0.33, 1);
  tScreen.position.set(0.5, 0.8, 0.6);
  decorGroup.add(tScreen);

  const oatMat = getMaterial('oat25', { color: 0xf5f0e0, roughness: 0.7, metalness: 0.0 });
  const oat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), oatMat);
  oat.position.set(-0.5, 1.1, 0.25);
  decorGroup.add(oat);

  const coldBrewMat = getMaterial('coldBrew25', { color: 0x3a2010, roughness: 0.4, transparent: true, opacity: 0.8 });
  const coldBrew = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.15, 12), coldBrewMat);
  coldBrew.position.set(0.3, 1.08, 0.2);
  decorGroup.add(coldBrew);

  const flatWhiteMat = getMaterial('flatWhite25', { color: 0xffffff, roughness: 0.5, metalness: 0.0 });
  const flatWhite = new THREE.Mesh(sharedGeo.mug, flatWhiteMat);
  flatWhite.position.set(-0.2, 1.08, -0.5);
  decorGroup.add(flatWhite);

  const minLightMat = getMaterial('minLight25', { color: 0xffffff, roughness: 0.2, metalness: 0.1 });
  const minLight = new THREE.Mesh(sharedGeo.sphere, minLightMat);
  minLight.position.set(0, 4.5, 0);
  decorGroup.add(minLight);

  const qrMat = getMaterial('qr25', { color: 0x1a1a1a, roughness: 0.8, side: THREE.DoubleSide });
  const qr = new THREE.Mesh(sharedGeo.poster, qrMat);
  qr.position.set(3.5, 2.8, -6.96);
  decorGroup.add(qr);

  const lap25Mat = getMaterial('lap25', { color: 0xcccccc, roughness: 0.3, metalness: 0.3 });
  const lap25 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.25), lap25Mat);
  lap25.position.set(-1.8, 0.78, -1.8);
  decorGroup.add(lap25);

  const reusableMat = getMaterial('reusable25', { color: 0x44aa66, roughness: 0.3, metalness: 0.2 });
  const reusable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.12, 16), reusableMat);
  reusable.position.set(0.7, 1.08, 0.35);
  decorGroup.add(reusable);
}

function create2055Decor() {
  const holoMat = getMaterial('holo55', { color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 });
  const holoMenu = new THREE.Mesh(sharedGeo.menuBoard, holoMat);
  holoMenu.position.set(0, 2.5, -6.95);
  decorGroup.add(holoMenu);

  const holoCupMat = getMaterial('holoCup55', { color: 0xffffff, emissive: 0x88ccff, emissiveIntensity: 0.3, transparent: true, opacity: 0.6 });
  const holoCup = new THREE.Mesh(sharedGeo.mug, holoCupMat);
  holoCup.position.set(0.5, 1.1, 0.2);
  decorGroup.add(holoCup);

  const robotMat = getMaterial('robot55', { color: 0x888888, roughness: 0.2, metalness: 0.8 });
  const armBase = new THREE.Mesh(sharedGeo.cylinder, robotMat);
  armBase.scale.set(0.15, 0.15, 0.15);
  armBase.position.set(1.5, 0.1, 0.3);
  decorGroup.add(armBase);

  const armSeg = new THREE.Mesh(sharedGeo.pedistal, robotMat);
  armSeg.position.set(1.5, 0.6, 0.3);
  armSeg.scale.y = 0.8;
  decorGroup.add(armSeg);

  const projMat = getMaterial('proj55', { color: 0x222244, roughness: 0.1, metalness: 0.6, emissive: 0x2244ff, emissiveIntensity: 0.3 });
  const projector = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), projMat);
  projector.position.set(-0.5, 0.9, 0.5);
  decorGroup.add(projector);

  const futLightMat = getMaterial('futLight55', { color: 0xffffff, emissive: 0x4488ff, emissiveIntensity: 0.8 });
  for (let i = 0; i < 3; i++) {
    const fl = new THREE.Mesh(sharedGeo.sphere, futLightMat);
    fl.position.set((i - 1) * 2, 4.5, (i % 2 === 0 ? -1 : 1));
    decorGroup.add(fl);
  }

  const smartGlassMat = getMaterial('smartGlass55', { color: 0x334466, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.5 });
  const smartTable = new THREE.Mesh(sharedGeo.tableTop, smartGlassMat);
  smartTable.position.set(-2, 0, 1);
  smartTable.scale.set(0.8, 1, 0.8);
  decorGroup.add(smartTable);

  const nanoMat = getMaterial('nano55', { color: 0x666688, roughness: 0.1, metalness: 0.9 });
  const nanoChair = new THREE.Mesh(sharedGeo.stoolSeat, nanoMat);
  nanoChair.position.set(3.5, 0.5, -1);
  decorGroup.add(nanoChair);

  const bioPlantMat = getMaterial('bioPlant55', { color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.5 });
  const bioPlant = new THREE.Mesh(sharedGeo.sphere, bioPlantMat);
  bioPlant.scale.set(0.5, 0.8, 0.5);
  bioPlant.position.set(-3, 0.5, -3);
  decorGroup.add(bioPlant);

  const futureCanMat = getMaterial('futureCan55', { color: 0xcc00ff, roughness: 0.2, metalness: 0.4, emissive: 0xcc00ff, emissiveIntensity: 0.2 });
  const futureCan = new THREE.Mesh(sharedGeo.bottle, futureCanMat);
  futureCan.scale.set(0.5, 1.8, 0.5);
  futureCan.position.set(-0.8, 1.1, 0.1);
  decorGroup.add(futureCan);

  const vizMat = getMaterial('viz55', { color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.6 });
  const vizBar = new THREE.Mesh(sharedGeo.box, vizMat);
  vizBar.scale.set(0.02, 0.3, 0.02);
  vizBar.position.set(3, 1.0, -0.5);
  decorGroup.add(vizBar);
}

// ============================================================
// Patrons
// ============================================================
function createPatrons() {
  const patronGroup = new THREE.Group();
  const patronPositions = [
    { x: -2, z: -1.5, rot: 0.3, era: 0 },
    { x: 1.5, z: -1.5, rot: -0.5, era: 0 },
    { x: 2.5, z: -0.5, rot: Math.PI, era: 1 },
    { x: -2.5, z: 0.5, rot: 0.8, era: 1 },
    { x: 0, z: -2.5, rot: -0.2, era: 2 },
    { x: 3, z: 1, rot: 0.4, era: 2 },
    { x: -1.5, z: 2, rot: -0.6, era: 3 },
    { x: 1, z: 2, rot: 0.1, era: 3 },
  ];

  const eraColors = [
    [0x3a3a5a, 0x5a5a3a],
    [0xcc6633, 0xffcc00],
    [0x333366, 0xcc3366],
    [0x222222, 0x444444],
    [0x2244aa, 0x333333],
    [0x4400aa, 0x00ff88],
  ];

  patronPositions.forEach((pos, i) => {
    const patron = new THREE.Group();
    const colors = eraColors[pos.era] || eraColors[0];

    const bodyMat = getMaterial('body' + i, { color: colors[0], roughness: 0.7, metalness: 0.0 });
    const body = new THREE.Mesh(sharedGeo.box, bodyMat);
    body.scale.set(0.35, 0.55, 0.2);
    body.position.y = 0.85;
    body.castShadow = true;
    patron.add(body);

    const headMat = getMaterial('head' + i, { color: 0xd4a574, roughness: 0.8, metalness: 0.0 });
    const head = new THREE.Mesh(sharedGeo.sphere, headMat);
    head.scale.set(0.15, 0.15, 0.15);
    head.position.y = 1.3;
    patron.add(head);

    const legMat = getMaterial('leg' + i, { color: 0x222233, roughness: 0.7 });
    for (let l = 0; l < 2; l++) {
      const leg = new THREE.Mesh(sharedGeo.box, legMat);
      leg.scale.set(0.08, 0.4, 0.08);
      leg.position.set((l === 0 ? -0.08 : 0.08), 0.3, 0);
      patron.add(leg);
    }

    const armMat = getMaterial('arm' + i, { color: colors[1], roughness: 0.6 });
    for (let a = 0; a < 2; a++) {
      const arm = new THREE.Mesh(sharedGeo.box, armMat);
      arm.scale.set(0.06, 0.35, 0.06);
      arm.position.set((a === 0 ? -0.22 : 0.22), 0.9, 0);
      arm.rotation.z = (a === 0 ? 0.3 : -0.3);
      patron.add(arm);
    }

    if (pos.era === 0) {
      const hatMat = getMaterial('hat45', { color: 0x2a2a4a, roughness: 0.5, metalness: 0.1 });
      const hat = new THREE.Mesh(sharedGeo.hat, hatMat);
      hat.position.y = 1.4;
      patron.add(hat);
    } else if (pos.era === 1) {
      const sunglassMat = getMaterial('shades65', { color: 0x111111, roughness: 0.1, metalness: 0.8, emissive: 0x111111, emissiveIntensity: 0.5 });
      const shade = new THREE.Mesh(sharedGeo.glasses, sunglassMat);
      shade.position.set(0, 1.32, 0.12);
      shade.scale.set(1.5, 0.8, 1);
      patron.add(shade);
    } else if (pos.era === 2) {
      const neonJacketMat = getMaterial('neonJacket85', { color: 0xff00ff, roughness: 0.3, metalness: 0.1, emissive: 0xff00ff, emissiveIntensity: 0.3 });
      const jacket = new THREE.Mesh(sharedGeo.jacket, neonJacketMat);
      jacket.position.y = 0.85;
      patron.add(jacket);
    } else if (pos.era === 3) {
      const hoodieMat = getMaterial('hoodie05', { color: 0x445566, roughness: 0.6, metalness: 0.0 });
      const hoodie = new THREE.Mesh(sharedGeo.jacket, hoodieMat);
      hoodie.position.y = 0.85;
      hoodie.scale.set(1, 1.1, 1);
      patron.add(hoodie);
    } else if (pos.era === 4) {
      const glassesMat = getMaterial('glasses25', { color: 0x333333, roughness: 0.2, metalness: 0.5 });
      const glasses = new THREE.Mesh(sharedGeo.glasses, glassesMat);
      glasses.position.set(0, 1.32, 0.12);
      glasses.scale.set(1.3, 0.7, 1);
      patron.add(glasses);
    } else if (pos.era === 5) {
      const visorMat = getMaterial('visor55', { color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.3 });
      const visor = new THREE.Mesh(sharedGeo.glasses, visorMat);
      visor.position.set(0, 1.32, 0.12);
      visor.scale.set(1.5, 0.5, 1);
      patron.add(visor);

      const neonTrimMat = getMaterial('neonTrim55', { color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.5 });
      const neonTrim = new THREE.Mesh(sharedGeo.box, neonTrimMat);
      neonTrim.scale.set(0.37, 0.02, 0.22);
      neonTrim.position.y = 1.1;
      patron.add(neonTrim);
    }

    patron.position.set(pos.x, 0, pos.z);
    patron.rotation.y = pos.rot;
    patronGroup.add(patron);
  });

  return patronGroup;
}

// ============================================================
// Audio System
// ============================================================
function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setupMusicNode();
    setupAmbience();
  } catch (e) {
    console.warn('Web Audio API not available:', e);
  }
}

function setupMusicNode() {
  if (!audioCtx) return;

  currentMusicGain = audioCtx.createGain();
  currentMusicGain.gain.value = 0.15;
  currentMusicGain.connect(audioCtx.destination);

  createPeriodMusic();
}

function createPeriodMusic() {
  if (!audioCtx || !currentMusicGain) return;

  if (audioNodes.musicInterval) {
    clearInterval(audioNodes.musicInterval);
  }

  const era = ERAS[currentEra];
  const styles = {
    jazz: { notes: [261.63, 329.63, 392.00, 440.00, 392.00, 329.63], tempo: 0.3 },
    motown: { notes: [329.63, 392.00, 440.00, 523.25, 440.00, 392.00], tempo: 0.25 },
    synthpop: { notes: [196.00, 246.94, 293.66, 349.23, 392.00, 440.00], tempo: 0.15 },
    indie: { notes: [220.00, 261.63, 293.66, 349.23, 329.63, 293.66], tempo: 0.2 },
    'lo-fi': { notes: [261.63, 293.66, 329.63, 349.23, 329.63, 293.66], tempo: 0.35 },
    ambient: { notes: [130.81, 164.81, 196.00, 220.00, 196.00, 164.81], tempo: 0.5 },
  };

  const style = styles[era.musicStyle] || styles.jazz;
  let noteIndex = 0;

  audioNodes.musicInterval = setInterval(() => {
    if (!audioCtx || animationPaused) return;
    playNote(style.notes[noteIndex % style.notes.length], 0.1, 0.3, style.tempo * 2);
    noteIndex++;
  }, style.tempo * 1000);
}

function playNote(freq, volume, duration, delay) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    gain.gain.value = Math.min(volume, 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(currentMusicGain);

    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration + 0.1);
  } catch (e) {
    // Silently fail for audio errors
  }
}

function setupAmbience() {
  if (!audioCtx) return;

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 0.5;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = sfxEnabled ? 0.03 : 0;

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noiseSource.start();

  audioNodes.ambience = { source: noiseSource, gain: noiseGain };
}

function playCoffeeSound() {
  if (!audioCtx || !sfxEnabled) return;
  try {
    const bufferSize = Math.floor(0.2 * audioCtx.sampleRate);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.15;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
  } catch (e) {
    // Silently fail
  }
}

function playTransitionSound() {
  if (!audioCtx || !sfxEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Silently fail
  }
}

function toggleSFX() {
  sfxEnabled = !sfxEnabled;
  if (audioNodes.ambience) {
    audioNodes.ambience.gain.gain.value = sfxEnabled ? 0.03 : 0;
  }
  return sfxEnabled;
}

// ============================================================
// Transition System
// ============================================================
function transitionToEra(eraIndex) {
  if (eraIndex === currentEra && transitionProgress >= 1) return;
  targetEra = eraIndex;
  transitionStart = clock.getElapsedTime();
  transitionProgress = 0;

  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), 500);

  playTransitionSound();

  document.querySelectorAll('.year-marker').forEach(m => m.classList.remove('active'));
  const activeMarker = document.querySelector('.year-marker[data-year="' + eraIndex + '"]');
  if (activeMarker) activeMarker.classList.add('active');

  const eraLabel = document.getElementById('era-label');
  eraLabel.textContent = ERAS[eraIndex].label;
  eraLabel.classList.add('visible');
  clearTimeout(eraLabel._timeout);
  eraLabel._timeout = setTimeout(() => eraLabel.classList.remove('visible'), 3000);
}

function updateTransition(delta) {
  if (transitionProgress >= 1) return;

  transitionProgress = Math.min(1, transitionProgress + delta / transitionDuration);

  const t = transitionProgress;
  const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  updateLightingForEra(currentEra + (targetEra - currentEra) * ease, ease);

  if (transitionProgress === 1) {
    currentEra = targetEra;
    createEraDecor(currentEra, 1);
    createPeriodMusic();
  } else {
    if (Math.floor(ease * 10) % 3 === 0) {
      createEraDecor(targetEra, ease);
    }
  }

  const prevFog = ERAS[Math.max(0, currentEra - 1)] ? ERAS[Math.max(0, currentEra - 1)].ambient : 0.6;
  const nextFog = ERAS[Math.min(ERAS.length - 1, targetEra)] ? ERAS[Math.min(ERAS.length - 1, targetEra)].ambient : 0.85;
  scene.fog.density = prevFog + (nextFog - prevFog) * ease;
}

// ============================================================
// Animation Loop
// ============================================================
let animationId = null;

function animate() {
  animationId = requestAnimationFrame(animate);

  if (animationPaused) return;

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();
  updateTransition(delta);

  // Animate subtle coffee steam
  const steamParticles = decorGroup.children.filter(function(c) { return c.userData && c.userData.isSteam; });
  steamParticles.forEach(function(p) {
    p.position.y += delta * 0.3;
    p.material.opacity = Math.max(0, 1 - p.position.y / 2);
    if (p.position.y > 2) {
      p.position.y = 1.0;
      p.material.opacity = 0.5;
    }
  });

  // Animate neon glow pulse
  decorGroup.children.forEach(function(child) {
    if (child.material && child.material.emissiveIntensity !== undefined && child.userData && child.userData.isNeon) {
      child.material.emissiveIntensity = 0.8 + Math.sin(elapsed * 2) * 0.3;
    }
  });

  // Render
  renderer.render(scene, camera);
}

// ============================================================
// Raycasting
// ============================================================
function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onClick(e) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(decorGroup.children, true);
  if (intersects.length > 0) {
    playCoffeeSound();
  }
}

// ============================================================
// UI Event Handlers
// ============================================================
function setupUI() {
  const slider = document.getElementById('timeline-slider');
  slider.addEventListener('input', function(e) {
    const eraIndex = parseInt(e.target.value);
    if (eraIndex !== currentEra || transitionProgress >= 1) {
      transitionToEra(eraIndex);
    }
  });

  document.getElementById('btn-pause').addEventListener('click', function() {
    animationPaused = !animationPaused;
    const btn = document.getElementById('btn-pause');
    btn.textContent = animationPaused ? '▶ Play' : '⏸ Pause';
    btn.classList.toggle('active', animationPaused);
    if (!animationPaused) clock.getDelta();
  });

  document.getElementById('btn-sfx').addEventListener('click', function() {
    const enabled = toggleSFX();
    const btn = document.getElementById('btn-sfx');
    btn.textContent = enabled ? '🔊 SFX' : '🔇 Mute';
    btn.classList.toggle('active', !enabled);
  });

  document.getElementById('btn-reset').addEventListener('click', function() {
    camera.position.set(5, 4, 7);
    controls.target.set(0, 1, 0);
    controls.update();
  });

  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('click', onClick, false);

  window.addEventListener('keydown', function(e) {
    if (e.key === ' ') {
      e.preventDefault();
      document.getElementById('btn-pause').click();
    } else if (e.key === 'ArrowLeft') {
      const newEra = Math.max(0, currentEra - 1);
      slider.value = newEra;
      transitionToEra(newEra);
    } else if (e.key === 'ArrowRight') {
      const newEra = Math.min(5, currentEra + 1);
      slider.value = newEra;
      transitionToEra(newEra);
    }
  });
}

// ============================================================
// Performance Monitor
// ============================================================
let fpsCounter = 0;
let fpsTime = 0;
function monitorPerformance() {
  fpsCounter++;
  fpsTime += clock.getDelta();
  if (fpsTime >= 1) {
    const fps = fpsCounter / fpsTime;
    if (fps < 30) {
      renderer.setPixelRatio(1);
    }
    fpsCounter = 0;
    fpsTime = 0;
  }
}

// ============================================================
// Initialization
// ============================================================
function init() {
  try {
    initSharedResources();
    initScene();
    createLighting();
    createCafé();
    createEraDecor(0, 1);
    const patrons = createPatrons();
    caféGroup.add(patrons);

    document.querySelector('.year-marker[data-year="0"]').classList.add('active');
    document.getElementById('era-label').textContent = ERAS[0].label;
    document.getElementById('era-label').classList.add('visible');

    setTimeout(function() {
      document.getElementById('loading').classList.add('hidden');
    }, 800);

    setupUI();

    const initAudioOnClick = function() {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (!audioCtx) initAudio();
      document.removeEventListener('click', initAudioOnClick);
      document.removeEventListener('keydown', initAudioOnClick);
    };
    document.addEventListener('click', initAudioOnClick);
    document.addEventListener('keydown', initAudioOnClick);

    animate();

    setInterval(monitorPerformance, 1000);

  } catch (e) {
    console.error('Failed to initialize café scene:', e);
    document.getElementById('loading').innerHTML = '<p style="color:#e8a849">Failed to load. Please refresh.</p>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
