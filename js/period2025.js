// 2025 Café Interior - Three.js Scene Builder
// Returns a THREE.Group containing all 2025 era specific objects

/**
 * Creates a group containing all 2025 era café items
 * @returns {THREE.Group} Group containing 2025 era objects
 */
function create2025Scene() {
  const group = new THREE.Group();

  // Constants for sizing and positioning
  const roomWidth = 8;
  const roomDepth = 6;
  const roomHeight = 3;

  // Helper function to create a bamboo and reclaimed wood table
  function createBambooTable(x, y, z, width = 1.6, depth = 0.9) {
    const tableGroup = new THREE.Group();

    // Tabletop: reclaimed wood planks
    const topGeo = new THREE.BoxGeometry(width, 0.05, depth);
    const topMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c, // wood brown
      roughness: 0.8,
      metalness: 0.1
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.025;
    tableGroup.add(top);

    // Bamboo legs (four tapered legs)
    const legRadius = 0.04;
    const legHeight = 0.7;
    const legPositions = [
      [-width/2 + legRadius, -depth/2 + legRadius],
      [width/2 - legRadius, -depth/2 + legRadius],
      [-width/2 + legRadius, depth/2 - legRadius],
      [width/2 - legRadius, depth/2 - legRadius]
    ];
    legPositions.forEach(([fx, fz]) => {
      const legGeo = new THREE.CylinderGeometry(legRadius, legRadius*0.7, legHeight, 8);
      const legMat = new THREE.MeshStandardMaterial({ 
        color: 0x8b6d5c,
        roughness: 0.6,
        metalness: 0.0
      });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x + fx, y - roomHeight/2 + legHeight/2, z + fz);
      tableGroup.add(leg);
    });

    tableGroup.position.set(x, y, z);
    return tableGroup;
  }

  // Helper function to create mid-century modern lounge chair
  function createLoungeChair(x, y, z, rotationY = 0) {
    const chairGroup = new THREE.Group();
    chairGroup.rotation.y = rotationY;

    // Seat and back (single organic shape)
    const seatBackGeo = new THREE.BoxGeometry(0.6, 0.3, 0.5);
    const seatBackMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // saddle brown leather
      roughness: 0.3,
      metalness: 0.0
    });
    const seatBack = new THREE.Mesh(seatBackGeo, seatBackMat);
    seatBack.position.set(0, 0.15, -0.1);
    chairGroup.add(seatBack);

    // Angled backrest
    const backRestGeo = new THREE.BoxGeometry(0.5, 0.4, 0.1);
    const backRestMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.3,
      metalness: 0.0
    });
    const backRest = new THREE.Mesh(backRestGeo, backRestMat);
    backRest.position.set(0, 0.35, -0.25);
    chairGroup.add(backRest);

    // Tapered wooden legs (four angled legs)
    const legSize = 0.04;
    const legLength = 0.4;
    const legAngles = [Math.PI/6, -Math.PI/6]; // splay angles
    const legPositions = [
      [-0.25, -0.2], // front left
      [0.25, -0.2],  // front right
      [-0.25, 0.15], // back left
      [0.25, 0.15]   // back right
    ];
    legPositions.forEach(([lx, lz], index) => {
      const legGeo = new THREE.CylinderGeometry(legSize, legSize*0.7, legLength, 8);
      const legMat = new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.0
      });
      const leg = new THREE.Mesh(legGeo, legMat);
      // Angle legs outward
      const angle = legAngles[index % 2];
      leg.rotation.z = Math.sin(angle) * 0.3; // slight splay
      leg.position.set(x + lx, y - roomHeight/2 + legLength/2, z + lz);
      chairGroup.add(leg);
    });

    chairGroup.position.set(x, y, z);
    return chairGroup;
  }

  // Helper function to create hanging plant installation
  function createHangingPlant(x, y, z, plantSize = 0.4) {
    const plantGroup = new THREE.Group();

    // Pot
    const potGeo = new THREE.CylinderGeometry(plantSize*0.5, plantSize*0.4, plantSize*0.3, 8);
    const potMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f2f, // dark green ceramic
      roughness: 0.8,
      metalness: 0.0
    });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = plantSize*0.15;
    plantGroup.add(pot);

    // Plant foliage (simplified as a sphere)
    const foliageGeo = new THREE.SphereGeometry(plantSize*0.6, 12, 12);
    const foliageMat = new THREE.MeshStandardMaterial({ 
      color: 0x228b22, // forest green
      roughness: 0.7,
      metalness: 0.0
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = plantSize*0.5;
    plantGroup.add(foliage);

    // Hanging strings (three strings)
    const stringMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.5,
      metalness: 0.0
    });
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const stringGeo = new THREE.CylinderGeometry(0.005, 0.005, plantSize*0.8, 4);
      const string = new THREE.Mesh(stringGeo, stringMat);
      string.position.set(
        Math.cos(angle) * plantSize*0.3,
        plantSize*0.4,
        Math.sin(angle) * plantSize*0.3
      );
      plantGroup.add(string);
    }

    plantGroup.position.set(x, y, z);
    return plantGroup;
  }

  // Helper function to create live-edge wood counter
  function createLiveEdgeCounter(x, y, z, width = 4, depth = 0.6, height = 0.9) {
    const counterGroup = new THREE.Group();

    // Live-edge countertop (irregular shape approximated)
    const counterGeo = new THREE.BoxGeometry(width, height, depth);
    const counterMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c, // wood
      roughness: 0.8,
      metalness: 0.1
    });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.y = height/2;
    counterGroup.add(counter);

    // Add live-edge effect (bumpy front edge)
    const edgeGeo = new THREE.BoxGeometry(width, 0.05, depth*0.3);
    const edgeMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.9,
      metalness: 0.0
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, height/2 + 0.025, -depth/2 + 0.025);
    counterGroup.add(edge);

    counterGroup.position.set(x, y, z);
    return counterGroup;
  }

  // Helper function to create smart display screen
  function createSmartDisplay(x, y, z, width = 1.2, height = 0.7) {
    const displayGroup = new THREE.Group();

    // Screen
    const screenGeo = new THREE.PlaneGeometry(width, height);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000, // black screen
      roughness: 0.1,
      metalness: 0.8
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.01;
    displayGroup.add(screen);

    // Frame
    const frameGeo = new THREE.BoxGeometry(width + 0.05, height + 0.05, 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f, // dark gray
      roughness: 0.3,
      metalness: 0.8
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    displayGroup.add(frame);

    displayGroup.position.set(x, y, z);
    return displayGroup;
  }

  // Helper function to create smart espresso machine
  function createEspressoMachine(x, y, z) {
    const machineGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f, // dark stainless
      roughness: 0.2,
      metalness: 0.9
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.15;
    machineGroup.add(body);

    // Touchscreen interface
    const screenGeo = new THREE.PlaneGeometry(0.25, 0.15);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.2, 0.16);
    machineGroup.add(screen);

    // Portafilter
    const portafilterGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
    const portafilterMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.3,
      metalness: 0.8
    });
    const portafilter = new THREE.Mesh(portafilterGeo, portafilterMat);
    portafilter.position.set(-0.15, 0.15, 0);
    machineGroup.add(portafilter);

    // Steam wand
    const steamWandGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6);
    const steamWandMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const steamWand = new THREE.Mesh(steamWandGeo, steamWandMat);
    steamWand.position.set(0.15, 0.2, 0);
    steamWand.rotation.z = Math.PI/4;
    machineGroup.add(steamWand);

    machineGroup.position.set(x, y, z);
    return machineGroup;
  }

  // Helper function to create IoT-connected grinder
  function createGrinder(x, y, z) {
    const grinderGroup = new THREE.Group();

    // Hopper
    const hopperGeo = new THREE.ConeGeometry(0.08, 0.15, 8);
    const hopperMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const hopper = new THREE.Mesh(hopperGeo, hopperMat);
    hopper.position.y = 0.2;
    grinderGroup.add(hopper);

    // Base
    const baseGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    grinderGroup.add(base);

    // Display panel
    const displayGeo = new THREE.PlaneGeometry(0.06, 0.04);
    const displayMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.25, 0.051);
    grinderGroup.add(display);

    grinderGroup.position.set(x, y, z);
    return grinderGroup;
  }

  // Helper function to create single-serve specialty brewer
  function createSpecialtyBrewer(x, y, z) {
    const brewerGroup = new THREE.Group();

    // Water tank
    const tankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
    const tankMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0, // light gray
      roughness: 0.3,
      metalness: 0.2
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = 0.15;
    brewerGroup.add(tank);

    // Brewing chamber
    const chamberGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
    const chamberMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    chamber.position.set(0, 0.025, 0.1);
    brewerGroup.add(chamber);

    // Display/touchpad
    const displayGeo = new THREE.PlaneGeometry(0.06, 0.04);
    const displayMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.2, 0.051);
    brewerGroup.add(display);

    brewerGroup.position.set(x, y, z);
    return brewerGroup;
  }

  // Helper function to create cold brew tower
  function createColdBrewTower(x, y, z) {
    const towerGroup = new THREE.Group();

    // Glass carafe
    const carafeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
    const carafeMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      opacity: 0.8,
      transparent: true,
      roughness: 0.1,
      metalness: 0.0
    });
    const carafe = new THREE.Mesh(carafeGeo, carafeMat);
    carafe.position.y = 0.15;
    towerGroup.add(carafe);

    // Valve and tap
    const valveGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6);
    const valveMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.set(0, 0, 0.12);
    towerGroup.add(valve);

    // Wooden frame
    const frameGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.1
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.125;
    towerGroup.add(frame);

    towerGroup.position.set(x, y, z);
    return towerGroup;
  }

  // Helper function to create nitrogen tap system
  function createNitrogenTap(x, y, z) {
    const tapGroup = new THREE.Group();

    // Nitrogen tank
    const tankGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
    const tankMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = 0.15;
    tapGroup.add(tank);

    // Tap tower
    const towerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
    const towerMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      roughness: 0.1,
      metalness: 0.9
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 0.225, 0);
    tapGroup.add(tower);

    // Tap handle
    const handleGeo = new THREE.BoxGeometry(0.03, 0.08, 0.02);
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.3,
      metalness: 0.0
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.275, 0.04);
    tapGroup.add(handle);

    tapGroup.position.set(x, y, z);
    return tapGroup;
  }

  // Helper function to create menu board with prices
  function createMenuBoard(x, y, z, width = 1.5, height = 0.8) {
    const boardGroup = new THREE.Group();

    // Backboard
    const backGeo = new THREE.PlaneGeometry(width, height);
    const backMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f, // dark slate
      roughness: 0.8,
      metalness: 0.1
    });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.z = 0.01;
    boardGroup.add(back);

    // Menu text (simplified as colored rectangles for text lines)
    const menuItems = [
      { text: 'Coffee $3.75', y: 0.25 },
      { text: 'Oat Milk Latte $5.25', y: 0.1 },
      { text: 'Matcha Latte $5.50', y: -0.05 },
      { text: 'Cold Brew $4.50', y: -0.2 },
      { text: 'Avocado Toast $12.00', y: -0.35 }
    ];

    menuItems.forEach(item => {
      const textGeo = new THREE.PlaneGeometry(width*0.8, 0.05);
      const textMat = new THREE.MeshStandardMaterial({ 
        color: 0xe0e0e0, // light gray text
        roughness: 0.9,
        metalness: 0.0
      });
      const text = new THREE.Mesh(textGeo, textMat);
      text.position.set(0, item.y, 0.011);
      boardGroup.add(text);
    });

    boardGroup.position.set(x, y, z);
    return boardGroup;
  }

  // Helper function to create Bluetooth speaker system (ceiling)
  function createCeilingSpeaker(x, y, z, size = 0.15) {
    const speakerGroup = new THREE.Group();

    // Speaker dome
    const domeGeo = new THREE.SphereGeometry(size, 12, 12, 0, Math.PI*2, 0, Math.PI/2);
    const domeMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.3,
      metalness: 0.8
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = size/2;
    speakerGroup.add(dome);

    // Speaker grille
    const grilleGeo = new THREE.CircleGeometry(size*0.9, 16);
    const grilleMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.9
    });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.position.y = size*0.01;
    grille.rotation.x = -Math.PI/2;
    speakerGroup.add(grille);

    speakerGroup.position.set(x, y, z);
    return speakerGroup;
  }

  // Helper function to create abstract gallery-style wall art
  function createWallArt(x, y, z, width = 0.8, height = 0.6) {
    const artGroup = new THREE.Group();

    // Canvas
    const canvasGeo = new THREE.PlaneGeometry(width, height);
    const canvasMat = new THREE.MeshStandardMaterial({ 
      color: 0xf8f4e3, // off-white canvas
      roughness: 0.9,
      metalness: 0.0
    });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = 0.01;
    artGroup.add(canvas);

    // Abstract painted shapes (simplified as colored rectangles)
    const shapes = [
      { color: 0xff6b6b, x: -0.2, y: 0.1, width: 0.3, height: 0.2 },
      { color: 4f46e5, x: 0.3, y: -0.1, width: 0.2, height: 0.3 },
      { color: 10b981, x: 0.0, y: -0.2, width: 0.4, height: 0.15 }
    ];

    shapes.forEach(shape => {
      const shapeGeo = new THREE.PlaneGeometry(shape.width, shape.height);
      const shapeMat = new THREE.MeshStandardMaterial({ 
        color: shape.color,
        roughness: 0.8,
        metalness: 0.0
      });
      const shapeMesh = new THREE.Mesh(shapeGeo, shapeMat);
      shapeMesh.position.set(shape.x, shape.y, 0.011);
      artGroup.add(shapeMesh);
    });

    artGroup.position.set(x, y, z);
    return artGroup;
  }

  // Helper function to create sustainability decals
  function createSustainabilityDecal(x, y, z, size = 0.3) {
    const decalGroup = new THREE.Group();

    // Leaf symbol
    const leafGeo = new THREE.PlaneGeometry(size, size*0.6);
    const leafMat = new THREE.MeshStandardMaterial({ 
      color: 0x10b981, // emerald green
      roughness: 0.8,
      metalness: 0.0
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 0, 0.01);
    decalGroup.add(leaf);

    // Text placeholder (simplified as lines)
    const textGeo = new THREE.PlaneGeometry(size*0.8, 0.02);
    const textMat = new THREE.MeshStandardMaterial({ 
      color: 0x10b981,
      roughness: 0.8,
      metalness: 0.0
    });
    const text = new THREE.Mesh(textGeo, textMat);
    text.position.set(0, -size*0.3, 0.011);
    decalGroup.add(text);

    decalGroup.position.set(x, y, z);
    return decalGroup;
  }

  // Helper function to create plant-based options sign
  function createPlantBasedSign(x, y, z, width = 0.6, height = 0.2) {
    const signGroup = new THREE.Group();

    // Sign background
    const bgGeo = new THREE.PlaneGeometry(width, height);
    const bgMat = new THREE.MeshStandardMaterial({ 
      color: 0x10b981, // green
      roughness: 0.8,
      metalness: 0.0
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    signGroup.add(bg);

    // Leaf icon
    const leafGeo = new THREE.PlaneGeometry(height*0.6, height*0.4);
    const leafMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.0
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(-width/2 + height*0.3, 0, 0.01);
    signGroup.add(leaf);

    // Text placeholder
    const textGeo = new THREE.PlaneGeometry(width*0.4, height*0.5);
    const textMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.0
    });
    const text = new THREE.Mesh(textGeo, textMat);
    text.position.set(width/4, 0, 0.011);
    signGroup.add(text);

    signGroup.position.set(x, y, z);
    return signGroup;
  }

  // Helper function to create QR code standee
  def createQRCodeStandee(x, y, z, width = 0.2, height = 0.3) {
    const standeeGroup = new THREE.Group();

    // Stand
    const standGeo = new THREE.BoxGeometry(0.02, height*0.3, 0.02);
    const standMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.1
    });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, -height/2 + standGeo.parameters.height/2, 0);
    standeeGroup.add(stand);

    // QR code board
    const qrGeo = new THREE.PlaneGeometry(width, height);
    const qrMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0, // white background
      roughness: 0.8,
      metalness: 0.0
    });
    const qrBackground = new THREE.Mesh(qrGeo, qrMat);
    qrBackground.position.set(0, 0, 0.01);
    standeeGroup.add(qrBackground);

    // QR code pattern (simplified as dark squares)
    const patternSize = 0.02;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if ((i + j) % 2 === 0) {
          const patchGeo = new THREE.BoxGeometry(patternSize, patternSize, 0.005);
          const patchMat = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.9,
            metalness: 0.0
          });
          const patch = new THREE.Mesh(patchGeo, patchMat);
          patch.position.set(
            -width/2 + (i + 0.5) * patternSize,
            -height/2 + (j + 0.5) * patternSize,
            0.015
          );
          standeeGroup.add(patch);
        }
      }
    }

    standeeGroup.position.set(x, y, z);
    return standeeGroup;
  }

  // Helper function to create local artisan collab notice
  function createArtisanNotice(x, y, z, width = 0.5, height = 0.3) {
    const noticeGroup = new THREE.Group();

    // Notice board
    const boardGeo = new THREE.PlaneGeometry(width, height);
    const boardMat = new THREE.MeshStandardMaterial({ 
      color: 0xf8f4e3, // cream
      roughness: 0.9,
      metalness: 0.0
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    noticeGroup.add(board);

    // Border
    const borderGeo = new THREE.BoxGeometry(width + 0.02, height + 0.02, 0.01);
    const borderMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.1
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.z = 0.005;
    noticeGroup.add(border);

    // Text lines (simplified)
    const lineHeight = 0.04;
    for (let i = 0; i < 3; i++) {
      const lineGeo = new THREE.PlaneGeometry(width*0.8, 0.02);
      const lineMat = new THREE.MeshStandardMaterial({ 
        color: 0x2f4f4f,
        roughness: 0.9,
        metalness: 0.0
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(0, height/2 - (i+1)*lineHeight, 0.011);
      noticeGroup.add(line);
    }

    noticeGroup.position.set(x, y, z);
    return noticeGroup;
  }

  // Helper function to create reusable ceramic cups
  function createCeramicCup(x, y, z, size = 0.08) {
    const cupGroup = new THREE.Group();

    // Cup body
    const bodyGeo = new THREE.CylinderGeometry(size, size*0.9, size*0.15, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0, // white ceramic
      roughness: 0.8,
      metalness: 0.0
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = size*0.075;
    cupGroup.add(body);

    // Handle
    const handleGeo = new THREE.TorusGeometry(size*0.3, size*0.08, 8, 16);
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      roughness: 0.8,
      metalness: 0.0
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(size*0.6, size*0.075, 0);
    handle.rotation.x = Math.PI/2;
    cupGroup.add(handle);

    // Geometric pattern (simple stripe)
    const stripeGeo = new THREE.BoxGeometry(size*0.7, size*0.02, size*0.14);
    const stripeMat = new THREE.MeshStandardMaterial({ 
      color: 0x10b981, // green accent
      roughness: 0.8,
      metalness: 0.0
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, size*0.12, 0);
    cupGroup.add(stripe);

    cupGroup.position.set(x, y, z);
    return cupGroup;
  }

  // Helper function to create compostable to-go cup
  function createToGoCup(x, y, z, size = 0.07) {
    const cupGroup = new THREE.Group();

    // Cup body (tapered)
    const bodyGeo = new THREE.CylinderGeometry(size*0.9, size, size*0.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c, // brown kraft
      roughness: 0.9,
      metalness: 0.0
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = size*0.1;
    cupGroup.add(body);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(size*0.95, size*0.95, size*0.02, 16);
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      roughness: 0.8,
      metalness: 0.0
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = size*0.21;
    cupGroup.add(lid);

    // Straw hole
    const strawGeo = new THREE.CylinderGeometry(size*0.03, size*0.03, size*0.1, 8);
    const strawMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.9,
      metalness: 0.0
    });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(size*0.3, size*0.22, 0);
    cupGroup.add(straw);

    cupGroup.position.set(x, y, z);
    return cupGroup;
  }

  // Helper function to create bamboo straw
  function createBambooStraw(x, y, z, length = 0.15, radius = 0.008) {
    const strawGeo = new THREE.CylinderGeometry(radius, radius, length, 8);
    const strawMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.0
    });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(x, y, z);
    return straw;
  }

  // Helper function to create silicone lid
  function createSiliconeLid(x, y, z, size = 0.09) {
    const lidGeo = new THREE.CylinderGeometry(size, size, size*0.02, 16);
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0x10b981, // green silicone
      roughness: 0.8,
      metalness: 0.0
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(x, y, z);
    return lid;
  }

  // Helper function to create digital menu tablet
  function createTablet(x, y, z, width = 0.18, height = 0.24) {
    const tabletGroup = new THREE.Group();

    // Tablet screen
    const screenGeo = new THREE.PlaneGeometry(width, height);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.005;
    tabletGroup.add(screen);

    // Tablet bezel
    const bezelGeo = new THREE.BoxGeometry(width + 0.02, height + 0.02, 0.008);
    const bezelMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.3,
      metalness: 0.8
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    tabletGroup.add(bezel);

    tabletGroup.position.set(x, y, z);
    return tabletGroup;
  }

  // Helper function to create contactless payment terminal
  function createPaymentTerminal(x, y, z, width = 0.08, height = 0.12) {
    const terminalGroup = new THREE.Group();

    // Terminal body
    const bodyGeo = new THREE.BoxGeometry(width, height, 0.02);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    terminalGroup.add(body);

    // Screen
    const screenGeo = new THREE.PlaneGeometry(width*0.8, height*0.6);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, 0.011);
    terminalGroup.add(screen);

    // Card slot
    const slotGeo = new THREE.BoxGeometry(width*0.6, 0.005, 0.01);
    const slotMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.9,
      metalness: 0.0
    });
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(0, -height*0.2, 0.011);
    terminalGroup.add(slot);

    terminalGroup.position.set(x, y, z);
    return terminalGroup;
  }

  // Helper function to create QR code ordering system (tabletop stand)
  function createQROrderStand(x, y, z, width = 0.1, height = 0.15) {
    const standGroup = new THREE.Group();

    // Stand base
    const baseGeo = new THREE.BoxGeometry(width, 0.02, width);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, -height/2 + 0.01, 0);
    standGroup.add(base);

    // Stand pole
    const poleGeo = new THREE.CylinderGeometry(0.008, 0.008, height*0.6, 8);
    const poleMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.1
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 0, 0);
    standGroup.add(pole);

    // QR code display
    const qrGeo = new THREE.PlaneGeometry(width*0.8, height*0.3);
    const qrMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      roughness: 0.8,
      metalness: 0.0
    });
    const qrBackground = new THREE.Mesh(qrGeo, qrMat);
    qrBackground.position.set(0, height/2 - 0.02, 0.01);
    standGroup.add(qrBackground);

    // QR pattern (simplified)
    const patternSize = 0.008;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2 === 0) {
          const patchGeo = new THREE.BoxGeometry(patternSize, patternSize, 0.002);
          const patchMat = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.9,
            metalness: 0.0
          });
          const patch = new THREE.Mesh(patchGeo, patchMat);
          patch.position.set(
            -width*0.4 + (i + 0.5) * patternSize,
            height/2 - 0.03 + (j + 0.5) * patternSize,
            0.012
          );
          standGroup.add(patch);
        }
      }
    }

    standGroup.position.set(x, y, z);
    return standGroup;
  }

  // Helper function to create tablet-based POS
  function createTabletPOS(x, y, z, width = 0.2, height = 0.3) {
    const posGroup = new THREE.Group();

    // Tablet
    const tabletGeo = new THREE.BoxGeometry(width, height, 0.01);
    const tabletMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.3,
      metalness: 0.8
    });
    const tablet = new THREE.Mesh(tabletGeo, tabletMat);
    posGroup.add(tablet);

    // Screen
    const screenGeo = new THREE.PlaneGeometry(width*0.9, height*0.8);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, 0.006);
    posGroup.add(screen);

    // Card reader
    const readerGeo = new THREE.BoxGeometry(width*0.3, height*0.1, 0.005);
    const readerMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const reader = new THREE.Mesh(readerGeo, readerMat);
    reader.position.set(0, -height*0.3, 0.006);
    posGroup.add(reader);

    posGroup.position.set(x, y, z);
    return posGroup;
  }

  // Helper function to create self-service kiosk
  function createSelfServiceKiosk(x, y, z, width = 0.3, height = 0.5, depth = 0.2) {
    const kioskGroup = new THREE.Group();

    // Kiosk body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, height/2, 0);
    kioskGroup.add(body);

    // Screen
    const screenGeo = new THREE.PlaneGeometry(width*0.8, height*0.6);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, depth/2 + 0.01);
    kioskGroup.add(screen);

    // Receipt printer slot
    const printerGeo = new THREE.BoxGeometry(width*0.4, height*0.1, depth*0.05);
    const printerMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const printer = new THREE.Mesh(printerGeo, printerMat);
    printer.position.set(0, -height*0.3, 0);
    kioskGroup.add(printer);

    kioskGroup.position.set(x, y, z);
    return kioskGroup;
  }

  // Helper function to create mobile order pickup shelf
  function createPickupShelf(x, y, z, width = 0.6, height = 0.05, depth = 0.3) {
    const shelfGroup = new THREE.Group();

    // Shelf
    const shelfGeo = new THREE.BoxGeometry(width, height, depth);
    const shelfMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b6d5c,
      roughness: 0.8,
      metalness: 0.1
    });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 0, 0);
    shelfGroup.add(shelf);

    // Dividers (for order separation)
    const dividerWidth = 0.02;
    const numDivisions = 3;
    for (let i = 1; i < numDivisions; i++) {
      const dividerGeo = new THREE.BoxGeometry(dividerWidth, height*0.5, depth);
      const dividerMat = new THREE.MeshStandardMaterial({ 
        color: 0x8b6d5c,
        roughness: 0.8,
        metalness: 0.1
      });
      const divider = new THREE.Mesh(dividerGeo, dividerMat);
      divider.position.set(
        -width/2 + (width/numDivisions)*i,
        height*0.25,
        0
      );
      shelfGroup.add(divider);
    }

    shelfGroup.position.set(x, y, z);
    return shelfGroup;
  }

  // Helper function to create patron (simplified as a capsule)
  function createPatron(x, y, z, height = 1.6, width = 0.4, depth = 0.2) {
    const patronGroup = new THREE.Group();

    // Body (capsule simplified as cylinder + sphere)
    const bodyGeo = new THREE.CylinderGeometry(width/2, width/2, height*0.7, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xffccbc, // skin tone
      roughness: 0.9,
      metalness: 0.0
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height*0.35;
    patronGroup.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(width/0.4, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ 
      color: 0xffccbc,
      roughness: 0.9,
      metalness: 0.0
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = height*0.8;
    patronGroup.add(head);

    // Simple clothing (shirt)
    const shirtGeo = new THREE.BoxGeometry(width*0.6, height*0.3, depth*0.6);
    const shirtMat = new THREE.MeshStandardMaterial({ 
      color: 0x4f46e5, // indigo (modern casual)
      roughness: 0.9,
      metalness: 0.0
    });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, height*0.5, 0);
    patronGroup.add(shirt);

    // Simple pants
    const pantsGeo = new THREE.BoxGeometry(width*0.5, height*0.25, depth*0.5);
    const pantsMat = new THREE.MeshStandardMaterial({ 
      color: 0x1f2937, // dark gray
      roughness: 0.9,
      metalness: 0.0
    });
    const pants = new THREE.Mesh(pantsGeo, pantsMat);
    pants.position.set(0, height*0.15, 0);
    patronGroup.add(pants);

    // Simple arms
    const armLength = height*0.3;
    const armWidth = width*0.15;
    const armGeo = new THREE.BoxGeometry(armWidth, armLength, armWidth);
    const armMat = new THREE.MeshStandardMaterial({ 
      color: 0xffccbc,
      roughness: 0.9,
      metalness: 0.0
    });
    // Left arm
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-width*0.4, height*0.4, 0);
    patronGroup.add(leftArm);
    // Right arm (holding smartphone)
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(width*0.4, height*0.4, 0);
    patronGroup.add(rightArm);

    // Smartphone in right hand
    const phoneGeo = new THREE.BoxGeometry(width*0.12, height*0.06, 0.008);
    const phoneMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.2,
      metalness: 0.8
    });
    const phone = new THREE.Mesh(phoneGeo, phoneMat);
    phone.position.set(width*0.45, height*0.35, depth*0.3);
    patronGroup.add(phone);

    // AirPods (small spheres on ears)
    const earbudGeo = new THREE.SphereGeometry(width*0.02, 6, 6);
    const earbudMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    // Left earbud
    const leftEarbud = new THREE.Mesh(earbudGeo, earbudMat);
    leftEarbud.position.set(-width*0.25, height*0.85, depth*0.1);
    patronGroup.add(leftEarbud);
    // Right earbud
    const rightEarbud = new THREE.Mesh(earbudGeo, earbudMat);
    rightEarbud.position.set(width*0.25, height*0.85, depth*0.1);
    patronGroup.add(rightEarbud);

    // Smartwatch (small box on wrist)
    const watchGeo = new THREE.BoxGeometry(width*0.04, width*0.02, width*0.01);
    const watchMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const watch = new THREE.Mesh(watchGeo, watchMat);
    watch.position.set(width*0.3, height*0.2, depth*0.25);
    patronGroup.add(watch);

    // Laptop on table (in front of patron)
    const laptopBaseGeo = new THREE.BoxGeometry(width*0.4, 0.02, width*0.3);
    const laptopBaseMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopBaseMat);
    laptopBase.position.set(0, height*0.4, -depth*0.2);
    patronGroup.add(laptopBase);

    const laptopScreenGeo = new THREE.PlaneGeometry(width*0.35, width*0.2);
    const laptopScreenMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.9
    });
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopScreenMat);
    laptopScreen.position.set(0, height*0.5, -depth*0.2 + 0.006);
    patronGroup.add(laptopScreen);

    patronGroup.position.set(x, y, z);
    return patronGroup;
  }

  // Helper function to create smart LED downlights (ceiling)
  function createLEDDownlight(x, y, z, size = 0.1) {
    const lightGroup = new THREE.Group();

    // Light housing
    const housingGeo = new THREE.CylinderGeometry(size*0.5, size*0.5, size*0.2, 8);
    const housingMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.set(0, 0, 0);
    lightGroup.add(housing);

    // Light emitter (emissive material would be better, but we'll simulate with bright color)
    const lightGeo = new THREE.CylinderGeometry(size*0.4, size*0.4, size*0.05, 8);
    const lightMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffe0, // warm white
      roughness: 0.1,
      metalness: 0.0,
      emissive: 0xffffe0,
      emissiveIntensity: 0.5
    });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, size*0.125, 0);
    lightGroup.add(light);

    lightGroup.position.set(x, y, z);
    return lightGroup;
  }

  // Helper function to create pendant lights with geometric shapes
  function createGeometricPendant(x, y, z, size = 0.15) {
    const pendantGroup = new THREE.Group();

    // Cord
    const cordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.5, 6);
    const cordMat = new THREE.MeshStandardMaterial({ 
      color: 0x2f4f4f,
      roughness: 0.2,
      metalness: 0.8
    });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.set(0, -0.25, 0);
    pendantGroup.add(cord);

    // Geometric shade (hexagon)
    const hexGeo = new THREE.CylinderGeometry(size, size, size*0.3, 6);
    const hexMat = new THREE.MeshStandardMaterial({ 
      color: 0xfbbf24, // amber
      roughness: 0.8,
      metalness: 0.0,
      opacity: 0.9,
      transparent: true
    });
    const hex = new THREE.Mesh(hexGeo, hexMat);
    hex.position.set(0, 0, 0);
    pendantGroup.add(hex);

    pendantGroup.position.set(x, y, z);
    return pendantGroup;
  }

  // Helper function to create accent LED strips
  function createLEDStrip(x, y, z, length = 0.5, width = 0.02, height = 0.01) {
    const stripGeo = new THREE.BoxGeometry(length, width, height);
    const stripMat = new THREE.MeshStandardMaterial({ 
      color: 0x10b981, // green accent
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x10b981,
      emissiveIntensity: 0.3
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(x, y, z);
    return strip;
  }

  // ===== SCENE ASSEMBLY =====

  // Floor (reclaimed wood planks)
  const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x8b6d5c,
    roughness: 0.9,
    metalness: 0.0
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -roomHeight/2;
  group.add(floor);

  // Ceiling (with lights)
  const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
  const ceilingMat = new THREE.MeshStandardMaterial({ 
    color: 0xf8f4e3, // off-white
    roughness: 0.9,
    metalness: 0.0
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI/2;
  ceiling.position.y = roomHeight/2;
  group.add(ceiling);

  // Back wall (with windows)
  const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
  const backWallMat = new THREE.MeshStandardMaterial({ 
    color: 0xe0e0e0, // light gray
    roughness: 0.9,
    metalness: 0.0
  });
  const backWall = new THREE.Mesh(backWallGeo, backWallMat);
  backWall.position.set(0, 0, -roomDepth/2);
  group.add(backWall);

  // Side walls
  const leftWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
  const leftWallMat = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0, // very light gray
    roughness: 0.9,
    metalness: 0.0
  });
  const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
  leftWall.position.set(-roomWidth/2, 0, 0);
  leftWall.rotation.y = Math.PI/2;
  group.add(leftWall);

  const rightWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
  const rightWallMat = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0,
    roughness: 0.9,
    metalness: 0.0
  });
  const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
  rightWall.position.set(roomWidth/2, 0, 0);
  rightWall.rotation.y = -Math.PI/2;
  group.add(rightWall);

  // Flooring details (rug)
  const rugGeo = new THREE.PlaneGeometry(roomWidth*0.6, roomDepth*0.5);
  const rugMat = new THREE.MeshStandardMaterial({ 
    color: 0x374151, // dark gray-blue
    roughness: 0.9,
    metalness: 0.0
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI/2;
  rug.position.set(0, -roomHeight/2 + 0.01, 0);
  group.add(rug);

  // === FURNITURE & DECOR ===

  // Bamboo and reclaimed wood tables
  const table1 = createBambooTable(-2, 0, -0.5);
  const table2 = createBambooTable(2, 0, 0.5);
  group.add(table1);
  group.add(table2);

  // Mid-century modern lounge chairs
  const lounge1 = createLoungeChair(-2.5, 0, -1.5, Math.PI/4);
  const lounge2 = createLoungeChair(2.5, 0, 1.5, -3*Math.PI/4);
  group.add(lounge1);
  group.add(lounge2);

  // Hanging plant installations
  const plant1 = createHangingPlant(-1.5, roomHeight/2 - 0.2, -1);
  const plant2 = createHangingPlant(1.5, roomHeight/2 - 0.2, 1);
  group.add(plant1);
  group.add(plant2);

  // Live-edge wood counter
  const counter = createLiveEdgeCounter(0, -roomHeight/2 + 0.45, roomDepth/2 - 0.3);
  group.add(counter);

  // Smart display screens (on walls)
  const display1 = createSmartDisplay(-roomWidth/2 + 0.2, roomHeight/2 - 0.4, -roomDepth/2 + 0.01);
  const display2 = createSmartDisplay(roomWidth/2 - 0.2, roomHeight/2 - 0.4, -roomDepth/2 + 0.01);
  group.add(display1);
  group.add(display2);

  // === COFFEE EQUIPMENT ===

  // Smart espresso machine
  const espressoMachine = createEspressoMachine(-1.2, -roomHeight/2 + 0.15, roomDepth/2 - 0.2);
  group.add(espressoMachine);

  // IoT-connected grinder
  const grinder = createGrinder(-0.8, -roomHeight/2 + 0.15, roomDepth/2 - 0.2);
  group.add(grinder);

  // Single-serve specialty brewer
  const brewer = createSpecialtyBrewer(-0.4, -roomHeight/2 + 0.15, roomDepth/2 - 0.2);
  group.add(brewer);

  // Cold brew tower
  const coldBrewTower = createColdBrewTower(0, -roomHeight/2 + 0.15, roomDepth/2 - 0.2);
  group.add(coldBrewTower);

  // Nitrogen tap system
  const nitrogenTap = createNitrogenTap(0.4, -roomHeight/2 + 0.15, roomDepth/2 - 0.2);
  group.add(nitrogenTap);

  // === MENU & PRICES ===

  // Menu board
  const menuBoard = createMenuBoard(-roomWidth/2 + 0.3, roomHeight/2 - 0.4, -roomDepth/2 + 0.01);
  group.add(menuBoard);

  // === AUDIO SETUP ===

  // Bluetooth speaker system (ceiling)
  const speaker1 = createCeilingSpeaker(-1.5, roomHeight/2 - 0.02, 0);
  const speaker2 = createCeilingSpeaker(1.5, roomHeight/2 - 0.02, 0);
  group.add(speaker1);
  group.add(speaker2);

  // === POSTERS & SIGNAGE ===

  // Art prints and abstract gallery-style wall art
  const wallArt1 = createWallArt(-roomWidth/2 + 0.2, roomHeight/2 - 0.5, -roomDepth/2 + 0.01);
  const wallArt2 = createWallArt(0, roomHeight/2 - 0.2, -roomDepth/2 + 0.01);
  const wallArt3 = createWallArt(roomWidth/2 - 0.2, roomHeight/2 - 0.5, -roomDepth/2 + 0.01);
  group.add(wallArt1);
  group.add(wallArt2);
  group.add(wallArt3);

  // Sustainability decals
  const ecoDecal1 = createSustainabilityDecal(-roomWidth/2 + 0.2, roomHeight/2 - 0.1, -roomDepth/2 + 0.01);
  const ecoDecal2 = createSustainabilityDecal(roomWidth/2 - 0.2, roomHeight/2 - 0.1, -roomDepth/2 + 0.01);
  group.add(ecoDecal1);
  group.add(ecoDecal2);

  // Plant-based options signs
  const plantSign1 = createPlantBasedSign(-roomWidth/2 + 0.3, -roomHeight/2 + 0.3, roomDepth/2 - 0.01);
  const plantSign2 = createPlantBasedSign(0, -roomHeight/2 + 0.3, roomDepth/2 - 0.01);
  const plantSign3 = createPlantBasedSign(roomWidth/2 - 0.3, -roomHeight/2 + 0.3, roomDepth/2 - 0.01);
  group.add(plantSign1);
  group.add(plantSign2);
  group.add(plantSign3);

  // QR code standee
  const qrStandee = createQRCodeStandee(0, -roomHeight/2 + 0.2, 0);
  group.add(qrStandee);

  // Local artisan collab notices
  const artisanNotice1 = createArtisanNotice(-roomWidth/2 + 0.2, roomHeight/2 - 0.3, -roomDepth/2 + 0.01);
  const artisanNotice2 = createArtisanNotice(0, roomHeight/2 - 0.3, -roomDepth/2 + 0.01);
  const artisanNotice3 = createArtisanNotice(roomWidth/2 - 0.2, roomHeight/2 - 0.3, -roomDepth/2 + 0.01);
  group.add(artisanNotice1);
  group.add(artisanNotice2);
  group.add(artisanNotice3);

  // === TABLEWARE ===

  // Reusable ceramic cups (on tables)
  const cup1 = createCeramicCup(-1.8, -roomHeight/2 + 0.1, -0.3);
  const cup2 = createCeramicCup(1.8, -roomHeight/2 + 0.1, 0.3);
  group.add(cup1);
  group.add(cup2);

  // Compostable to-go cups (near counter)
  const togoCup1 = createToGoCup(-1.2, -roomHeight/2 + 0.1, roomDepth/2 - 0.1);
  const togoCup2 = createToGoCup(1.2, -roomHeight/2 + 0.1, roomDepth/2 - 0.1);
  group.add(togoCup1);
  group.add(togoCup2);

  // Bamboo straws (in cups)
  const straw1 = createBambooStraw(-1.0, -roomHeight/2 + 0.2, roomDepth/2 - 0.1);
  const straw2 = createBambooStraw(1.0, -roomHeight/2 + 0.2, roomDepth/2 - 0.1);
  group.add(straw1);
  group.add(straw2);

  // Silicone lids (on to-go cups)
  const lid1 = createSiliconeLid(-1.2, -roomHeight/2 + 0.22, roomDepth/2 - 0.1);
  const lid2 = createSiliconeLid(1.2, -roomHeight/2 + 0.22, roomDepth/2 - 0.1);
  group.add(lid1);
  group.add(lid2);

  // Digital menu tablets (on tables)
  const tablet1 = createTablet(-1.8, -roomHeight/2 + 0.1, -0.3);
  const tablet2 = createTablet(1.8, -roomHeight/2 + 0.1, 0.3);
  group.add(tablet1);
  group.add(tablet2);

  // === COUNTER TECHNOLOGY ===

  // Contactless payment terminal
  const paymentTerminal = createPaymentTerminal(0.8, -roomHeight/2 + 0.1, roomDepth/2 - 0.1);
  group.add(paymentTerminal);

  // QR code ordering system (on tables)
  const qrOrder1 = createQROrderStand(-1.8, -roomHeight/2 + 0.1, -0.3);
  const qrOrder2 = createQROrderStand(1.8, -roomHeight/2 + 0.1, 0.3);
  group.add(qrOrder1);
  group.add(qrOrder2);

  // Tablet-based POS
  const tabletPOS = createTabletPOS(0, -roomHeight/2 + 0.1, roomDepth/2 - 0.1);
  group.add(tabletPOS);

  // Self-service kiosk option
  const selfServiceKiosk = createSelfServiceKiosk(1.5, -roomHeight/2 + 0.25, roomDepth/2 - 0.1);
  group.add(selfServiceKiosk);

  // Mobile order pickup shelf
  const pickupShelf = createPickupShelf(-1.5, -roomHeight/2 + 0.3, roomDepth/2 - 0.1);
  group.add(pickupShelf);

  // === PATRONS ===

  // Patron 1
  const patron1 = createPatron(-2.2, -roomHeight/2 + 0.8, -0.8);
  group.add(patron1);

  // Patron 2
  const patron2 = createPatron(1.8, -roomHeight/2 + 0.8, 0.5);
  group.add(patron2);

  // Patron 3
  const patron3 = createPatron(-0.5, -roomHeight/2 + 0.8, 1.2);
  group.add(patron3);

  // === LIGHTING ===

  // Smart LED downlights (ceiling)
  const light1 = createLEDDownlight(-1.5, roomHeight/2 - 0.02, -0.5);
  const light2 = createLEDDownlight(0, roomHeight/2 - 0.02, 0);
  const light3 = createLEDDownlight(1.5, roomHeight/2 - 0.02, 0.5);
  group.add(light1);
  group.add(light2);
  group.add(light3);

  // Pendant lights with geometric shapes
  const pendant1 = createGeometricPendant(-1.5, roomHeight/2 - 0.3, -1);
  const pendant2 = createGeometricPendant(1.5, roomHeight/2 - 0.3, 1);
  group.add(pendant1);
  group.add(pendant2);

  // Accent LED strips (under counter and shelves)
  const ledStrip1 = createLEDStrip(-1.8, -roomHeight/2 + 0.48, roomDepth/2 - 0.31);
  const ledStrip2 = createLEDStrip(1.8, -roomHeight/2 + 0.48, roomDepth/2 - 0.31);
  group.add(ledStrip1);
  group.add(ledStrip2);

  // Natural light from windows (simulated as bright rectangles on walls)
  const window1Geo = new THREE.PlaneGeometry(1, 1.5);
  const window1Mat = new THREE.MeshStandardMaterial({ 
    color: 0xe6f7ff, // light blue tint
    opacity: 0.6,
    transparent: true
  });
  const window1 = new THREE.Mesh(window1Geo, window1Mat);
  window1.position.set(-roomWidth/2 + 0.01, roomHeight/2 - 0.75, -roomDepth/2);
  group.add(window1);

  const window2Geo = new THREE.PlaneGeometry(1, 1.5);
  const window2Mat = new THREE.MeshStandardMaterial({ 
    color: 0xe6f7ff,
    opacity: 0.6,
    transparent: true
  });
  const window2 = new THREE.Mesh(window2Geo, window2Mat);
  window2.position.set(roomWidth/2 - 0.01, roomHeight/2 - 0.75, -roomDepth/2);
  group.add(window2);

  return group;
}

// Export as ES6 module
export default { create2025Scene };