// 1945 Café Interior - Three.js Scene Builder
// Returns a THREE.Group containing all 1945 era specific objects

/**
 * Creates a group containing all 1945 era café items
 * @returns {THREE.Group} Group containing 1945 era objects
 */
function create1945Scene() {
  const group = new THREE.Group();

  // Constants for sizing and positioning
  const roomWidth = 8;
  const roomDepth = 6;
  const roomHeight = 3;

  // Helper function to create a wooden table with checked tablecloth
  function createWoodenTable(x, y, z, size = 1.5) {
    const tableGroup = new THREE.Group();

    // Tabletop
    const topGeo = new THREE.BoxGeometry(size, 0.1, size);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // saddle brown
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.05;
    tableGroup.add(top);

    // Tablecloth (checkered pattern simplified as a checkered texture - we'll use a solid color for simplicity)
    const clothGeo = new THREE.BoxGeometry(size * 0.9, 0.02, size * 0.9);
    const clothMat = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // yellow for now, but we'll try to simulate checkered with texture later
      opacity: 0.9,
      transparent: true
    });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.y = 0.06;
    tableGroup.add(cloth);

    // Legs
    const legSize = 0.1;
    const legHeight = 0.7;
    const legPositions = [
      [-size/2 + legSize/2, -size/2 + legSize/2],
      [size/2 - legSize/2, -size/2 + legSize/2],
      [-size/2 + legSize/2, size/2 - legSize/2],
      [size/2 - legSize/2, size/2 - legSize/2]
    ];
    legPositions.forEach(([fx, fz]) => {
      const legGeo = new THREE.BoxGeometry(legSize, legHeight, legSize);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x + fx, y - roomHeight/2 + legHeight/2, z + fz);
      tableGroup.add(leg);
    });

    tableGroup.position.set(x, y, z);
    return tableGroup;
  }

  // Add wooden tables with checked tablecloths
  const table1 = createWoodenTable(-2, 0, -1);
  const table2 = createWoodenTable(2, 0, 1);
  group.add(table1);
  group.add(table2);

  // Formica-topped counter stools (at the counter)
  function createCounterStool(x, y, z) {
    const stoolGroup = new THREE.Group();

    // Seat
    const seatGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    const seatMat = new THREE.MeshStandardMaterial({ 
      color: 0xffa500, // orange for Formica
      roughness: 0.2,
      metalness: 0.8
    });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.025;
    stoolGroup.add(seat);

    // Leg (chrome)
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
    const legMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0, // silver
      roughness: 0.1,
      metalness: 0.9
    });
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.y = 0.3;
    stoolGroup.add(leg);

    stoolGroup.position.set(x, y, z);
    return stoolGroup;
  }

  // Add counter stools
  const stool1 = createCounterStool(-1.5, 0, 2); // counter is at z=2
  const stool2 = createCounterStool(1.5, 0, 2);
  group.add(stool1);
  group.add(stool2);

  // Chrome-and-leather bar stools
  function createBarStool(x, y, z) {
    const stoolGroup = new THREE.Group();

    // Seat (leather)
    const seatGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
    const seatMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b0000, // dark red for leather
      roughness: 0.3,
      metalness: 0.1
    });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.05;
    stoolGroup.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.1, 0.3, 0.25);
    const backMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b0000,
      roughness: 0.3,
      metalness: 0.1
    });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 0.2, -0.15);
    stoolGroup.add(back);

    // Chrome base and pole
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.025;
    stoolGroup.add(base);

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8);
    const poleMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 0.375;
    stoolGroup.add(pole);

    stoolGroup.position.set(x, y, z);
    return stoolGroup;
  }

  // Add bar stools
  const barStool1 = createBarStool(-2, 0, 2.5);
  const barStool2 = createBarStool(2, 0, 2.5);
  group.add(barStool1);
  group.add(barStool2);

  // Wall-mounted coat hooks
  function createCoatHook(x, y, z) {
    const hookGroup = new THREE.Group();

    // Hook (chrome)
    const hookGeo = new THREE.TorusGeometry(0.05, 0.02, 8, 16, Math.PI);
    const hookMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const hook = new THREE.Mesh(hookGeo, hookMat);
    hook.rotation.x = Math.PI / 2;
    hook.position.set(0, 0, 0);
    hookGroup.add(hook);

    // Mount (wood)
    const mountGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.set(0, -0.05, 0);
    hookGroup.add(mount);

    hookGroup.position.set(x, y, z);
    return hookGroup;
  }

  // Add coat hooks on the back wall (z = -3)
  for (let x = -3; x <= 3; x += 1.5) {
    const hook = createCoatHook(x, 1.2, -2.9); // near top of back wall
    group.add(hook);
  }

  // Classic wooden chairs with woven seats
  function createWoodenChair(x, y, z) {
    const chairGroup = new THREE.Group();

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.4, 0.05, 0.4);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.4;
    chairGroup.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.4, 0.3, 0.05);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 0.55, -0.2);
    chairGroup.add(back);

    // Legs
    const legSize = 0.05;
    const legHeight = 0.4;
    const legPositions = [
      [-0.15, -0.15],
      [0.15, -0.15],
      [-0.15, 0.15],
      [0.15, 0.15]
    ];
    legPositions.forEach(([fx, fz]) => {
      const legGeo = new THREE.BoxGeometry(legSize, legHeight, legSize);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x + fx, y - roomHeight/2 + legHeight/2, z + fz);
      chairGroup.add(leg);
    });

    // Woven seat texture (simplified with a grid)
    // We'll just change the seat material to a checker for now
    seat.material = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      map: createCheckerTexture(0.4, 0.4, 10, 10) // we'll need to create a texture
    });

    chairGroup.position.set(x, y, z);
    return chairGroup;
  }

  // Helper to create a checkerboard texture
  function createCheckerTexture(width, height, squaresX, squaresY) {
    const canvas = document.createElement('canvas');
    canvas.width = squaresX * 2;
    canvas.height = squaresY * 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (let x = 0; x < squaresX; x++) {
      for (let y = 0; y < squaresY; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * 2, y * 2, 2, 2);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(squaresX / 2, squaresY / 2);
    return texture;
  }

  // Add wooden chairs
  const chair1 = createWoodenChair(-2.5, 0, -1.5);
  const chair2 = createWoodenChair(2.5, 0, 1.5);
  group.add(chair1);
  group.add(chair2);

  // Vintage clock on the wall
  function createWallClock(x, y, z) {
    const clockGroup = new THREE.Group();

    // Clock face
    const faceGeo = new THREE.CircleGeometry(0.3, 32);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.rotation.y = Math.PI / 2; // face outward from wall
    clockGroup.add(face);

    // Clock frame
    const frameGeo = new THREE.RingGeometry(0.3, 0.32, 32);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.rotation.y = Math.PI / 2;
    clockGroup.add(frame);

    // Clock hands (simplified)
    const hourHandGeo = new THREE.BoxGeometry(0.02, 0.1, 0.02);
    const hourHandMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const hourHand = new THREE.Mesh(hourHandGeo, hourHandMat);
    hourHand.position.set(0, 0, 0.16);
    clockGroup.add(hourHand);

    const minuteHandGeo = new THREE.BoxGeometry(0.02, 0.15, 0.02);
    const minuteHandMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const minuteHand = new THREE.Mesh(minuteHandGeo, minuteHandMat);
    minuteHand.position.set(0, 0, 0.18);
    clockGroup.add(minuteHand);

    clockGroup.position.set(x, y, z);
    return clockGroup;
  }

  // Add clock on the front wall (z = 3)
  const clock = createWallClock(0, 1, 2.9);
  group.add(clock);

  // COFFEE EQUIPMENT
  // Traditional stovetop percolator
  function createPercolator(x, y, z) {
    const potGroup = new THREE.Group();

    // Pot body
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x708090, // slate gray
      roughness: 0.3,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.15;
    potGroup.add(body);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16);
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0x708090,
      roughness: 0.3,
      metalness: 0.8
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.3;
    potGroup.add(lid);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.05, 0.02, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0x708090,
      roughness: 0.3,
      metalness: 0.8
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.2, 0.15, 0);
    potGroup.add(handle);

    // Spout
    const spoutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
    const spoutMat = new THREE.MeshStandardMaterial({ 
      color: 0x708090,
      roughness: 0.3,
      metalness: 0.8
    });
    const spout = new THREE.Mesh(spoutGeo, spoutMat);
    spout.rotation.z = Math.PI / 2;
    spout.position.set(0.15, 0.15, 0);
    potGroup.add(spout);

    potGroup.position.set(x, y, z);
    return potGroup;
  }

  // Add percolator on counter
  const percolator = createPercolator(-0.5, 0, 2.1);
  group.add(percolator);

  // Manual espresso machine (LaMarzocco style)
  function createEspressoMachine(x, y, z) {
    const machineGroup = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(0.4, 0.1, 0.3);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0, // stainless steel
      roughness: 0.2,
      metalness: 0.9
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    machineGroup.add(base);

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.35, 0.3, 0.25);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    machineGroup.add(body);

    // Portafilter
    const portafilterGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16);
    const portafilterMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9
    });
    const portafilter = new THREE.Mesh(portafilterGeo, portafilterMat);
    portafilter.position.set(0.1, 0.2, 0.1);
    machineGroup.add(portafilter);

    // Steam wand
    const wandGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8);
    const wandMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9
    });
    const wand = new THREE.Mesh(wandGeo, wandMat);
    wand.position.set(-0.1, 0.25, 0.1);
    wand.rotation.z = Math.PI / 4;
    machineGroup.add(wand);

    machineGroup.position.set(x, y, z);
    return machineGroup;
  }

  // Add espresso machine on counter
  const espressoMachine = createEspressoMachine(0.5, 0, 2.1);
  group.add(espressoMachine);

  // Metal french press carafes
  function createFrenchPress(x, y, z) {
    const pressGroup = new THREE.Group();

    // Carafe
    const carafeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
    const carafeMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9,
      opacity: 0.9,
      transparent: true
    });
    const carafe = new THREE.Mesh(carafeGeo, carafeMat);
    carafe.position.y = 0.125;
    pressGroup.add(carafe);

    // Lid and plunger
    const lidGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 16);
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.25;
    pressGroup.add(lid);

    const plungerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const plungerMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9
    });
    const plunger = new THREE.Mesh(plungerGeo, plungerMat);
    plunger.position.y = 0.025;
    pressGroup.add(plunger);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.9
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.15, 0.125, 0);
    pressGroup.add(handle);

    pressGroup.position.set(x, y, z);
    return pressGroup;
  }

  // Add french press on counter
  const frenchPress = createFrenchPress(1.0, 0, 2.1);
  group.add(frenchPress);

  // Ceramic drip filters
  function createDripFilter(x, y, z) {
    const filterGroup = new THREE.Group();

    // Filter holder (cone)
    const holderGeo = new THREE.ConeGeometry(0.1, 0.2, 16);
    const holderMat = new THREE.MeshStandardMaterial({ 
      color: 0xf5deb3, // wheat
      roughness: 0.8,
      metalness: 0.1
    });
    const holder = new THREE.Mesh(holderGeo, holderMat);
    holder.position.y = 0.1;
    filterGroup.add(holder);

    // Carafe (glass)
    const carafeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
    const carafeMat = new THREE.MeshStandardMaterial({ 
      color: 0xf0f8ff, // alice blue
      roughness: 0.1,
      metalness: 0.0,
      opacity: 0.9,
      transparent: true
    });
    const carafe = new THREE.Mesh(carafeGeo, carafeMat);
    carafe.position.set(0, 0, 0.1);
    filterGroup.add(carafe);

    filterGroup.position.set(x, y, z);
    return filterGroup;
  }

  // Add drip filter on counter
  const dripFilter = createDripFilter(0, 0, 2.1);
  group.add(dripFilter);

  // MENU & PRICES
  // Menu board (chalkboard)
  function createMenuBoard(x, y, z) {
    const boardGroup = new THREE.Group();

    // Board
    const boardGeo = new THREE.BoxGeometry(0.8, 0.5, 0.02);
    const boardMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f, // dark slate gray
      roughness: 0.9,
      metalness: 0.1
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0;
    boardGroup.add(board);

    // Frame
    const frameGeo = new THREE.BoxGeometry(0.82, 0.52, 0.01);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0;
    boardGroup.add(frame);

    // Menu text (we'll simulate with a texture - for now just a placeholder)
    // In a real implementation, we would create a canvas texture with the menu text
    // For simplicity, we'll just leave it as a dark board

    boardGroup.position.set(x, y, z);
    return boardGroup;
  }

  // Add menu board on the left wall
  const menuBoard = createMenuBoard(-3.9, 0.5, 0); // left wall at x = -4
  group.add(menuBoard);

  // AUDIO SETUP
  // Wall-mounted wireless set/radio
  function createWirelessSet(x, y, z) {
    const radioGroup = new THREE.Group();

    // Cabinet (wood)
    const cabinetGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.position.y = 0;
    radioGroup.add(cabinet);

    // Speaker cloth
    const speakerGeo = new THREE.BoxGeometry(0.25, 0.15, 0.01);
    const speakerMat = new THREE.MeshStandardMaterial({ 
      color: 0x696969, // dim gray
      roughness: 0.9,
      metalness: 0.1
    });
    const speaker = new THREE.Mesh(speakerGeo, speakerMat);
    speaker.position.set(0, 0, 0.076);
    radioGroup.add(speaker);

    // Dial
    const dialGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(-0.08, 0.02, 0.08);
    radioGroup.add(dial);

    radioGroup.position.set(x, y, z);
    return radioGroup;
  }

  // Add wireless set on the right wall
  const wirelessSet = createWirelessSet(3.9, 0.5, 0); // right wall at x = 4
  group.add(wirelessSet);

  // POSTERS & SIGNAGE
  // WWII-era propaganda posters (we'll create simple rectangles with textured images - for now colored rectangles)
  function createPoster(x, y, z, width, height, color) {
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.9,
        metalness: 0.1
      })
    );
    poster.position.set(x, y, z);
    // Posters on walls face inward
    if (z === -3) { // back wall
      poster.rotation.y = Math.PI;
    } else if (x === -4) { // left wall
      poster.rotation.y = Math.PI / 2;
    } else if (x === 4) { // right wall
      poster.rotation.y = -Math.PI / 2;
    }
    return poster;
  }

  // Add posters
  const warBondsPoster = createPoster(-2, 1.5, -2.9, 0.6, 0.4, 0xb22222); // firebrick
  const rosiePoster = createPoster(0, 1.5, -2.9, 0.5, 0.4, 0xff8c00); // dark orange
  const warStampsPoster = createPoster(2, 1.5, -2.9, 0.6, 0.4, 0x1e90ff); // dodger blue
  group.add(warBondsPoster);
  group.add(rosiePoster);
  group.add(warStampsPoster);

  // Vintage Coca-Cola signs (simplified as a red rectangle with white text)
  function createCocaColaSign(x, y, z) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.2),
      new THREE.MeshStandardMaterial({ 
        color: 0xff0000, // red
        roughness: 0.9,
        metalness: 0.1
      })
    );
    sign.position.set(x, y, z);
    if (z === -3) {
      sign.rotation.y = Math.PI;
    } else if (x === -4) {
      sign.rotation.y = Math.PI / 2;
    } else if (x === 4) {
      sign.rotation.y = -Math.PI / 2;
    }
    return sign;
  }

  const cocaColaSign = createCocaColaSign(0, 1, -2.9);
  group.add(cocaColaSign);

  // Hand-painted chalk menu board (we already have a menu board, but let's add a small one as a chalkboard)
  function createChalkboard(x, y, z) {
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.2),
      new THREE.MeshStandardMaterial({ 
        color: 0x2f4f4f,
        roughness: 0.9,
        metalness: 0.1
      })
    );
    board.position.set(x, y, z);
    if (z === -3) {
      board.rotation.y = Math.PI;
    } else if (x === -4) {
      board.rotation.y = Math.PI / 2;
    } else if (x === 4) {
      board.rotation.y = -Math.PI / 2;
    }
    return board;
  }

  const chalkboard = createChalkboard(-3.5, 0.2, -2.9);
  group.add(chalkboard);

  // 'Open' neon sign (simplified as a glowing rectangle)
  function createOpenSign(x, y, z) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.15),
      new THREE.MeshStandardMaterial({ 
        color: 0xff0000, // red
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.9
      })
    );
    sign.position.set(x, y, z);
    if (z === -3) {
      sign.rotation.y = Math.PI;
    } else if (x === -4) {
      sign.rotation.y = Math.PI / 2;
    } else if (x === 4) {
      sign.rotation.y = -Math.PI / 2;
    }
    return sign;
  }

  const openSign = createOpenSign(-3.5, 1.8, -2.9);
  group.add(openSign);

  // TABLEWARE
  // White ceramic cups and saucers
  function createCupAndSaucer(x, y, z) {
    const set = new THREE.Group();

    // Saucer
    const saucerGeo = new THREE.RingGeometry(0.15, 0.2, 32);
    const saucerMat = new THREE.MeshStandardMaterial({ 
      color: 0xfffff0,
      roughness: 0.1,
      metalness: 0.0
    });
    const saucer = new THREE.Mesh(saucerGeo, saucerMat);
    saucer.rotation.x = -Math.PI / 2;
    saucer.position.y = 0.01;
    set.add(saucer);

    // Cup
    const cupGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16);
    const cupMat = new THREE.MeshStandardMaterial({ 
      color: 0xfffff0,
      roughness: 0.1,
      metalness: 0.0
    });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(0, 0.07, 0);
    set.add(cup);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.03, 0.01, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0xfffff0,
      roughness: 0.1,
      metalness: 0.0
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.08, 0.07, 0);
    set.add(handle);

    set.position.set(x, y, z);
    return set;
  }

  // Add cups and saucers on tables
  const cup1 = createCupAndSaucer(-2.2, 0, -0.8);
  const cup2 = createCupAndSaucer(-1.8, 0, -0.8);
  const cup3 = createCupAndSaucer(1.8, 0, 0.8);
  const cup4 = createCupAndSaucer(2.2, 0, 0.8);
  group.add(cup1);
  group.add(cup2);
  group.add(cup3);
  group.add(cup4);

  // Chrome-plated creamer and sugar bowls
  function createCreamer(x, y, z) {
    const creamer = new THREE.Group();

    // Bowl
    const bowlGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const bowlMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.y = 0.03;
    creamer.add(bowl);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.02, 0.005, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.08, 0.03, 0);
    creamer.add(handle);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16);
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.06;
    creamer.add(lid);

    creamer.position.set(x, y, z);
    return creamer;
  }

  function createSugarBowl(x, y, z) {
    const bowl = new THREE.Group();

    // Bowl
    const bowlGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const bowlMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const mesh = new THREE.Mesh(bowlGeo, bowlMat);
    mesh.position.y = 0.03;
    bowl.add(mesh);

    // Lid (with knob)
    const lidGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16);
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.06;
    bowl.add(lid);

    // Knob
    const knobGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const knobMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.position.set(0, 0.07, 0);
    bowl.add(knob);

    bowl.position.set(x, y, z);
    return bowl;
  }

  // Add creamer and sugar bowl on counter
  const creamer = createCreamer(-0.2, 0, 2.1);
  const sugarBowl = createSugarBowl(0.2, 0, 2.1);
  group.add(creamer);
  group.add(sugarBowl);

  // Paper napkins (simplified as thin white rectangles)
  function createNapkin(x, y, z) {
    const napkin = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.1),
      new THREE.MeshStandardMaterial({ 
        color: 0xfffff0,
        roughness: 0.5,
        metalness: 0.0,
        opacity: 0.9,
        transparent: true
      })
    );
    napkin.position.set(x, y, z);
    return napkin;
  }

  // Add napkins
  const napkin1 = createNapkin(-2.1, 0.06, -0.8);
  const napkin2 = createNapkin(-1.9, 0.06, -0.8);
  const napkin3 = createNapkin(1.9, 0.06, 0.8);
  const napkin4 = createNapkin(2.1, 0.06, 0.8);
  group.add(napkin1);
  group.add(napkin2);
  group.add(napkin3);
  group.add(napkin4);

  // Disposable paper cups
  function createPaperCup(x, y, z) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.08, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xfff8dc, // cream
        roughness: 0.5,
        metalness: 0.0
      })
    );
    cup.position.set(x, y, z);
    return cup;
  }

  // Add paper cups
  const paperCup1 = createPaperCup(-2.2, 0.06, -0.8);
  const paperCup2 = createPaperCup(1.8, 0.06, 0.8);
  group.add(paperCup1);
  group.add(paperCup2);

  // COUNTER TECHNOLOGY
  // Manual cash register (NCR style)
  function createCashRegister(x, y, z) {
    const register = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(0.2, 0.1, 0.15);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.5,
      metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    register.add(base);

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.18, 0.12, 0.13);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.5,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.11;
    register.add(body);

    // Buttons
    const buttonGeo = new THREE.BoxGeometry(0.01, 0.01, 0.005);
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const button = new THREE.Mesh(buttonGeo, buttonMat);
        button.set(
          -0.03 + col * 0.03,
          0.15 - row * 0.02,
          0.065
        );
        register.add(button);
      }
    }

    // Cash drawer handle
    const handleGeo = new THREE.BoxGeometry(0.02, 0.02, 0.06);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.05, -0.065);
    register.add(handle);

    register.position.set(x, y, z);
    return register;
  }

  // Add cash register on counter
  const cashRegister = createCashRegister(0, 0, 2.1);
  group.add(cashRegister);

  // Paper receipt printer (simplified as a small box)
  function createReceiptPrinter(x, y, z) {
    const printer = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.05, 0.08),
      new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.5,
        metalness: 0.2
      })
    );
    printer.position.set(x, y, z);
    return printer;
  }

  const receiptPrinter = createReceiptPrinter(-0.3, 0, 2.1);
  group.add(receiptPrinter);

  // Cash drawer (part of the register, but we'll make it separate for clarity)
  // Actually, the cash drawer is part of the register above, so we'll skip.

  // Manual order tickets (small pad)
  function createOrderPad(x, y, z) {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.005),
      new THREE.MeshStandardMaterial({ 
        color: 0xfffff0,
        roughness: 0.5,
        metalness: 0.0
      })
    );
    pad.position.set(x, y, z);
    return pad;
  }

  const orderPad = createOrderPad(0.3, 0, 2.1);
  group.add(orderPad);

  // PATRONS
  // We'll create simple human figures using basic shapes
  function createPatronMale(x, y, z) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.2, 0.4, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x000080 }); // navy blue for suit
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac }); // skin tone
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.5;
    group.add(head);

    // Hat (fedora)
    const hatGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 0.58;
    group.add(hat);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x000080 });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-0.05, 0.0, 0);
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0.05, 0.0, 0);
    group.add(leg1);
    group.add(leg2);

    group.position.set(x, y, z);
    return group;
  }

  function createPatronFemale(x, y, z) {
    const group = new THREE.Group();

    // Body (dress)
    const bodyGeo = new THREE.BoxGeometry(0.18, 0.35, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 }); // dark red dress
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.175;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.42;
    group.add(head);

    // Hair (victory rolls - simplified as a bulge on the side)
    const hairGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(-0.08, 0.45, 0);
    group.add(hair);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.04, 0.2, 0.04);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-0.04, 0.0, 0);
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0.04, 0.0, 0);
    group.add(leg1);
    group.add(leg2);

    group.position.set(x, y, z);
    return group;
  }

  // Add patrons
  const patron1 = createPatronMale(-1.5, 0, -1.5);
  const patron2 = createPatronFemale(1.5, 0, 1.5);
  group.add(patron1);
  group.add(patron2);

  // LIGHTING
  // Warm incandescent bulbs (we'll add some point lights or emissive spheres)
  // But note: the scene renderer already has lights. We'll add some emissive bulbs for visual effect.
  function createLightBulb(x, y, z) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 16, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.0
      })
    );
    bulb.position.set(x, y, z);
    return bulb;
  }

  // Add bulb on the ceiling (simple grid)
  for (let x = -2; x <= 2; x += 1.5) {
    for (let z = -2; z <= 2; z += 1.5) {
      const bulb = createLightBulb(x, 1.45, z); // just below ceiling (y=1.5)
      group.add(bulb);
    }
  }

  // Pendant lights with metal shades
  function createPendantLight(x, y, z) {
    const group = new THREE.Group();

    // Cord
    const cordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.5, 8);
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.y = -0.25;
    group.add(cord);

    // Shade (metal)
    const shadeGeo = new THREE.ConeGeometry(0.1, 0.05, 16);
    const shadeMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.8
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    // The cone points down, so we rotate it 180 degrees around x
    // Actually, ConeGeometry points up by default, so we want to rotate 180 around x to point down
    // But we'll just position it at the bottom of the cord
    // We'll create a upside-down cone by scaling y by -1? Instead, let's rotate.
    // We'll rotate the shade 180 degrees around the x-axis so the wide part is at the bottom.
    // Actually, we can just use the cone as is and position it below the cord, but then the point is down.
    // Let's do: the cone's point is at the top, so we want the point up? No, we want the wide part down.
    // So we'll rotate 180 degrees around x.
    shade.rotation.x = Math.PI;
    shade.position.y = -0.5;
    group.add(shade);

    // Bulb inside the shade
    const bulb = createLightBulb(0, -0.45, 0);
    group.add(bulb);

    group.position.set(x, y, z);
    return group;
  }

  // Add pendant lights over tables
  const pendant1 = createPendantLight(-2, 0, -1);
  const pendant2 = createPendantLight(2, 0, 1);
  group.add(pendant1);
  group.add(pendant2);

  // Candlelight accents (small flames on tables)
  function createCandle(x, y, z) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.04, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xff4500, // orange red
        emissive: 0xff4500,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.0
      })
    );
    flame.position.set(x, y, z);
    return flame;
  }

  // Add candles on tables
  const candle1 = createCandle(-2, 0.06, -1);
  const candle2 = createCandle(2, 0.06, 1);
  group.add(candle1);
  group.add(candle2);

  // Return the group
  return group;
}

// Export the function
if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
  module.exports = { create1945Scene };
} else {
  window.create1945Scene = create1945Scene;
}