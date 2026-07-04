// 1985 Café Interior - Three.js Scene Builder
// Returns a THREE.Group containing all 1985 era specific objects

/**
 * Creates a group containing all 1985 era café items
 * @returns {THREE.Group} Group containing 1985 era objects
 */
function create1985Scene() {
  const group = new THREE.Group();

  // Constants for sizing and positioning
  const roomWidth = 8;
  const roomDepth = 6;
  const roomHeight = 3;

  // Helper function to create a boxy wood-paneled table
  function createWoodPaneledTable(x, y, z, size = 1.8) {
    const tableGroup = new THREE.Group();

    // Tabletop with wood panel texture (simulated with color)
    const topGeo = new THREE.BoxGeometry(size, 0.05, size);
    const topMat = new THREE.MeshStandardMaterial({ 
      color: 0x654321, // dark wood
      roughness: 0.8
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.025;
    tableGroup.add(top);

    // Table sides (paneling effect)
    const side thickness = 0.02;
    const sideGeo = new THREE.BoxGeometry(size, side thickness, size * 0.1); // front
    const sideMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // saddle brown
      roughness: 0.7
    });
    const frontSide = new THREE.Mesh(sideGeo, sideMat);
    frontSide.position.set(0, side thickness/2, size/2 - side thickness/2);
    tableGroup.add(frontSide);

    const backSide = new THREE.Mesh(sideGeo.clone(), sideMat);
    backSide.position.set(0, side thickness/2, -size/2 + side thickness/2);
    tableGroup.add(backSide);

    const leftSideGeo = new THREE.BoxGeometry(side thickness, side thickness, size);
    const leftSide = new THREE.Mesh(leftSideGeo, sideMat);
    leftSide.set(-size/2 + side thickness/2, side thickness/2, 0);
    tableGroup.add(leftSide);

    const rightSideGeo = new THREE.BoxGeometry(side thickness, side thickness, size);
    const rightSide = new THREE.Mesh(rightSideGeo, sideMat);
    rightSide.set(size/2 - side thickness/2, side thickness/2, 0);
    tableGroup.add(rightSide);

    // Legs (simple square)
    const legSize = 0.08;
    const legHeight = 0.6;
    const legGeo = new THREE.BoxGeometry(legSize, legHeight, legSize);
    const legMat = new THREE.MeshStandardMaterial({ 
      color: 0x654321,
      roughness: 0.8
    });

    const legPositions = [
      [-size/2 + legSize/2, -size/2 + legSize/2],
      [size/2 - legSize/2, -size/2 + legSize/2],
      [-size/2 + legSize/2, size/2 - legSize/2],
      [size/2 - legSize/2, size/2 - legSize/2]
    ];

    legPositions.forEach(([fx, fz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x + fx, y - roomHeight/2 + legHeight/2, z + fz);
      tableGroup.add(leg);
    });

    tableGroup.position.set(x, y, z);
    return tableGroup;
  }

  // Helper function to create a neon-accented vinyl booth
  function createVinylBooth(x, y, z, width = 1.5, depth = 0.6, height = 1.0) {
    const boothGroup = new THREE.Group();

    // Base seat
    const seatGeo = new THREE.BoxGeometry(width, 0.1, depth);
    const seatMat = new THREE.MeshStandardMaterial({ 
      color: 0xff00ff, // magenta vinyl
      roughness: 0.3
    });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.05;
    boothGroup.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(width, height, 0.1);
    const backMat = new THREE.MeshStandardMaterial({ 
      color: 0xff00ff,
      roughness: 0.3
    });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, height/2, -depth/2 - 0.05);
    boothGroup.add(back);

    // Neon accent (thin strips along edges)
    const neonGeo = new THREE.BoxGeometry(width, 0.02, 0.02);
    const neonMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, // cyan neon
      emissive: 0x00ffff,
      emissiveIntensity: 1.5
    });

    // Front neon
    const frontNeon = new THREE.Mesh(neonGeo, neonMat);
    frontNeon.position.set(0, 0.06, depth/2 - 0.01);
    boothGroup.add(frontNeon);

    // Back neon
    const backNeon = new THREE.Mesh(neonGeo, neonMat);
    backNeon.position.set(0, 0.06, -depth/2 + 0.01);
    boothGroup.add(backNeon);

    // Side neons
    const sideNeonGeo = new THREE.BoxGeometry(0.02, 0.02, depth);
    const sideNeonLeft = new THREE.Mesh(sideNeonGeo, neonMat);
    sideNeonLeft.position.set(-width/2 + 0.01, 0.06, 0);
    boothGroup.add(sideNeonLeft);

    const sideNeonRight = new THREE.Mesh(sideNeonGeo, neonMat);
    sideNeonRight.position.set(width/2 - 0.01, 0.06, 0);
    boothGroup.add(sideNeonRight);

    boothGroup.position.set(x, y, z);
    return boothGroup;
  }

  // Add furniture
  const table1 = createWoodPaneledTable(-2.5, 0, -1.2);
  const table2 = createWoodPaneledTable(2.5, 0, 1.2);
  group.add(table1);
  group.add(table2);

  const booth1 = createVinylBooth(-2, 0, 2.2); // booth along back wall
  const booth2 = createVinylBooth(2, 0, 2.2);
  group.add(booth1);
  group.add(booth2);

  // Walls with geometric pattern wallpaper (simplified as colored wall with texture)
  // We'll create four walls
  const wallThickness = 0.1;
  const wallHeight = roomHeight;

  // Back wall
  const backWallGeo = new THREE.BoxGeometry(roomWidth, wallHeight, wallThickness);
  const backWallMat = new THREE.MeshStandardMaterial({ 
    color: 0x00008b, // dark blue for geometric pattern base
    roughness: 0.9
  });
  const backWall = new THREE.Mesh(backWallGeo, backWallMat);
  backWall.position.set(0, 0, -roomDepth/2 + wallThickness/2);
  group.add(backWall);

  // Left wall
  const leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, roomDepth);
  const leftWallMat = backWallMat.clone();
  const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
  leftWall.position.set(-roomWidth/2 + wallThickness/2, 0, 0);
  group.add(leftWall);

  // Right wall
  const rightWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, roomDepth);
  const rightWall = new THREE.Mesh(rightWallGeo, leftWallMat);
  rightWall.position.set(roomWidth/2 - wallThickness/2, 0, 0);
  group.add(rightWall);

  // Front wall (with window/wall space for TV, posters, etc.)
  const frontWallGeo = new THREE.BoxGeometry(roomWidth, wallHeight, wallThickness);
  const frontWall = new THREE.Mesh(frontWallGeo, backWallMat);
  frontWall.position.set(0, 0, roomDepth/2 - wallThickness/2);
  group.add(frontWall);

  // Counter (at front, between the two tables)
  function createCounter(x, y, z, width = 4, depth = 0.6, height = 1.0) {
    const counterGroup = new THREE.Group();

    // Counter top
    const topGeo = new THREE.BoxGeometry(width, 0.05, depth);
    const topMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080, // gray laminate
      roughness: 0.2
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = height/2;
    counterGroup.add(top);

    // Counter front panel
    // Front panel (with neon accent)
    const frontGeo = new THREE.BoxGeometry(width, height*0.8, 0.05);
    const frontMat = new THREE.MeshStandardMaterial({ 
      color: 0x00008b, // dark blue
      roughness: 0.9
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.set(0, 0, depth/2 - 0.025);
    counterGroup.add(front);

    // Neon accent on front panel (strip along bottom)
    const neonGeo = new THREE.BoxGeometry(width, 0.05, 0.05);
    const neonMat = new THREE.MeshStandardMaterial({ 
      color: 0xff00ff, // magenta neon
      emissive: 0xff00ff,
      emissiveIntensity: 2
    });
    const neonStrip = new THREE.Mesh(neonGeo, neonMat);
    neonStrip.position.set(0, -height*0.35, depth/2 - 0.025);
    counterGroup.add(neonStrip);

    counterGroup.position.set(x, y, z);
    return counterGroup;
  }

  const counter = createCounter(0, 0, roomDepth/2 - 0.3);
  group.add(counter);

  // Coffee equipment
  // Espresso machine
  function createEspressoMachine(x, y, z) {
    const machineGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.5, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0, // stainless steel
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.25;
    machineGroup.add(body);

    // Steam wand
    const wandGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const wandMat = bodyMat.clone();
    const wand = new THREE.Mesh(wandGeo, wandMat);
    wand.position.set(0.25, 0.4, -0.15);
    wand.rotation.z = Math.PI/4;
    machineGroup.add(wand);

    // Group head
    const headGeo = new THREE.BoxGeometry(0.15, 0.05, 0.15);
    const headMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.3
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.3, 0.15);
    machineGroup.add(head);

    machineGroup.position.set(x, y, z);
    return machineGroup;
  }

  // Drip coffee system
  function createDripSystem(x, y, z) {
    const systemGroup = new THREE.Group();

    // Water reservoir
    const resGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    const resMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      roughness: 0.1
    });
    const reservoir = new THREE.Mesh(resGeo, resMat);
    reservoir.position.y = 0.1;
    systemGroup.add(reservoir);

    // Filter basket
    const basketGeo = new THREE.BoxGeometry(0.15, 0.02, 0.15);
    const basketMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.5
    });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.set(0, 0.11, 0);
    systemGroup.add(basket);

    // Carafe (glass pot)
    const carafeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16);
    const carafeMat = new THREE.MeshStandardMaterial({ 
      color: 0xfffff0,
      opacity: 0.8,
      transparent: true,
      roughness: 0.1,
      metalness: 0.0
    });
    const carafe = new THREE.Mesh(carafeGeo, carafeMat);
    carafe.position.set(-0.12, 0.06, 0);
    systemGroup.add(carafe);

    // Warming plate
    const plateGeo = new THREE.BoxGeometry(0.1, 0.01, 0.1);
    const plateMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      emissive: 0x808080,
      emissiveIntensity: 0.5
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(-0.12, 0.005, 0);
    systemGroup.add(plate);

    systemGroup.position.set(x, y, z);
    return systemGroup;
  }

  // Bagged whole beans display
  function createBeanDisplay(x, y, z) {
    const displayGroup = new THREE.Group();

    // Shelf
    const shelfGeo = new THREE.BoxGeometry(0.5, 0.02, 0.2);
    const shelfMat = new THREE.MeshStandardMaterial({ 
      color: 0x654321,
      roughness: 0.8
    });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.y = 0.01;
    displayGroup.add(shelf);

    // Bean bags (simple boxes)
    const bagGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
    const bagMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b0000, // dark red
      roughness: 0.4
    });

    for (let i = 0; i < 3; i++) {
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(-0.15 + i*0.15, 0.03, 0);
      displayGroup.add(bag);
    }

    displayGroup.position.set(x, y, z);
    return displayGroup;
  }

  // Place coffee equipment on counter
  const espressoMachine = createEspressoMachine(-0.8, 0.5, roomDepth/2 - 0.3);
  const dripSystem = createDripSystem(0, 0.5, roomDepth/2 - 0.3);
  const beanDisplay = createBeanDisplay(0.8, 0.5, roomDepth/2 - 0.3);
  group.add(espressoMachine);
  group.add(dripSystem);
  group.add(beanDisplay);

  // Menu board (on back wall)
  function createMenuBoard(x, y, z, width = 1.2, height = 0.8) {
    const boardGroup = new THREE.Group();

    // Board backing
    const backGeo = new THREE.BoxGeometry(width, height, 0.02);
    const backMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000, // blackboard
      roughness: 0.9
    });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 0, 0);
    boardGroup.add(back);

    // Menu text (simplified as colored rectangles for items)
    // We'll create lines for each menu item
    const lineHeight = 0.1;
    const startY = height/2 - lineHeight/2;
    const items = [
      {text: "Coffee", price: "$1.25"},
      {text: "Latte", price: "$2.50"},
      {text: "Cappuccino", price: "$2.75"},
      {text: "Scone", price: "$2.25"},
      {text: "Bagel", price: "$1.50"}
    ];

    items.forEach((item, index) => {
      const yPos = startY - index * lineHeight;
      // Text background (white)
      const textBgGeo = new THREE.BoxGeometry(width*0.9, lineHeight*0.8, 0.01);
      const textBgMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.1
      });
      const textBg = new THREE.Mesh(textBgGeo, textBgMat);
      textBg.position.set(-width*0.35, yPos, 0.011); // slightly forward
      boardGroup.add(textBg);

      // We won't render actual text, but we can use different colors to represent text
      // For simplicity, we'll leave it as white boxes. In a real app, we'd use a texture loader.
    });

    boardGroup.position.set(x, y, z);
    return boardGroup;
  }

  const menuBoard = createMenuBoard(0, roomHeight/2 - 0.4, -roomDepth/2 + 0.02);
  group.add(menuBoard);

  // Audio setup: Portable boombox on counter
  function createBoombox(x, y, z) {
    const boxGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.2, 0.15, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000, // black
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.075;
    boxGroup.add(body);

    // Speakers (left and right)
    const speakerGeo = new THREE.BoxGeometry(0.04, 0.08, 0.06);
    const speakerMat = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, // red
      roughness: 0.2
    });
    const leftSpeaker = new THREE.Mesh(speakerGeo, speakerMat);
    leftSpeaker.position.set(-0.06, 0.075, 0);
    boxGroup.add(leftSpeaker);

    const rightSpeaker = new THREE.Mesh(speakerGeo, speakerMat);
    rightSpeaker.position.set(0.06, 0.075, 0);
    boxGroup.add(rightSpeaker);

    // Cassette tape slot
    const slotGeo = new THREE.BoxGeometry(0.08, 0.02, 0.06);
    const slotMat = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.5
    });
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(0, 0.02, 0.051); // slightly forward
    boxGroup.add(slot);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 4);
    const antennaMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.8,
      roughness: 0.1
    });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0.07, 0.15, 0);
    boxGroup.add(antenna);

    boxGroup.position.set(x, y, z);
    return boxGroup;
  }

  const boombox = createBoombox(-0.8, 0.6, roomDepth/2 - 0.31); // on counter, slightly forward
  group.add(boombox);

  // Posters & Signage (on walls)
  // We'll create simple poster frames with colors to represent different posters
  function createPoster(x, y, z, width = 0.4, height = 0.3, color = 0xff0000) {
    const posterGroup = new THREE.Group();

    const frameGeo = new THREE.BoxGeometry(width, height, 0.02);
    const frameMat = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.5
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0, 0);
    posterGroup.add(frame);

    // Add a slight border to simulate frame
    const borderGeo = new THREE.BoxGeometry(width*1.05, height*1.05, 0.01);
    const borderMat = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // yellow border
      opacity: 0.5,
      transparent: true
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(0, 0, 0.01);
    posterGroup.add(border);

    posterGroup.position.set(x, y, z);
    return posterGroup;
  }

  // Miami Vice poster (pastel colors)
  const miamiVicePoster = createPoster(-2.5, roomHeight/2 - 0.2, -roomDepth/2 + 0.02, 0.5, 0.3, 0x00bfff);
  group.add(miamiVicePoster);

  // Springsteen poster
  const springsteenPoster = createPoster(-1.5, roomHeight/2 - 0.5, -roomDepth/2 + 0.02, 0.4, 0.3, 0x8b0000);
  group.add(springsteenPoster);

  // U2 poster
  const u2Poster = createPoster(-0.5, roomHeight/2 - 0.2, -roomDepth/2 + 0.02, 0.4, 0.3, 0x000080);
  group.add(u2Poster);

  // New Coke promotional sign (red and white)
  const newCokeSign = createPoster(0.5, roomHeight/2 - 0.5, -roomDepth/2 + 0.02, 0.3, 0.2, 0xff0000);
  group.add(newCokeSign);

  // Neon-lit cityscape backdrop (on back wall, we'll use a series of rectangles)
  function createCityscape(x, y, z, width = 0.8, height = 0.4) {
    const cityGroup = new THREE.Group();

    // Base (sky)
    const skyGeo = new THREE.BoxGeometry(width, height, 0.01);
    const skyMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      emissive: 0x000000
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 0, 0);
    cityGroup.add(sky);

    // Buildings (simple rectangles with neon windows)
    const buildingWidth = 0.08;
    const buildingHeight = 0.15;
    for (let i = 0; i < 5; i++) {
      const buildingGeo = new THREE.BoxGeometry(buildingWidth, buildingHeight, 0.01);
      const buildingMat = new THREE.MeshStandardMaterial({ 
        color: 0x202020,
        roughness: 0.9
      });
      const building = new THREE.Mesh(buildingGeo, buildingMat);
      building.position.set(-width/2 + buildingWidth/2 + i*buildingWidth*1.2, -height/2 + buildingHeight/2, 0.005);
      cityGroup.add(building);

      // Neon windows (yellow squares)
      const windowGeo = new THREE.BoxGeometry(buildingWidth*0.6, buildingHeight*0.3, 0.005);
      const windowMat = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 2
      });
      const window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(building.position.x, building.position.y + buildingHeight*0.2, building.position.z + 0.006);
      cityGroup.add(window);
    }

    cityGroup.position.set(x, y, z);
    return cityGroup;
  }

  const cityscape = createCityscape(0, roomHeight/2, -roomDepth/2 + 0.015, 4, 1.5);
  group.add(cityscape);

  // "Keep on Rockin" sign (neon text simulation)
  function createNeonSign(x, y, z, width = 0.8, height = 0.15) {
    const signGroup = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(width, height, 0.02);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.9
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0, 0);
    signGroup.add(base);

    // Neon tubes (simplified as lines)
    // We'll create a few rectangles to represent the neon tubes forming the text
    const tubeGeo = new THREE.BoxGeometry(width*0.8, 0.01, 0.01);
    const tubeMat = new THREE.MeshStandardMaterial({ 
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 3
    });

    // Three horizontal lines for simplicity
    for (let i = 0; i < 3; i++) {
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(0, -height/3 + i*0.03, 0.015);
      signGroup.add(tube);
    }

    signGroup.position.set(x, y, z);
    return signGroup;
  }

  const rockinSign = createNeonSign(0, -roomHeight/2 + 0.2, -roomDepth/2 + 0.02, 0.7, 0.1);
  group.add(rockinSign);

  // Tableware (on tables)
  // Disposable plastic cups with lids and straws
  function createPlasticCup(x, y, z) {
    const cupGroup = new THREE.Group();

    // Cup
    const cupGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.08, 16);
    const cupMat = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // yellow
      opacity: 0.9,
      transparent: true,
      roughness: 0.1
    });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = 0.04;
    cupGroup.add(cup);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.005, 16);
    const lidMat = cupMat.clone();
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.085;
    cupGroup.add(lid);

    // Straw
    const strawGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.12, 8);
    const strawMat = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.2
    });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(0.01, 0.095, 0);
    cupGroup.add(straw);

    cupGroup.position.set(x, y, z);
    return cupGroup;
  }

  // Ceramic mugs with 1980s graphics
  function createCeramicMug(x, y, z) {
    const mugGroup = new THREE.Group();

    // Mug body
    const bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.04;
    mugGroup.add(body);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.015, 0.005, 8, 16, Math.PI);
    const handleMat = bodyMat.clone();
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.06, 0.04, 0);
    mugGroup.add(handle);

    // Graphic (simple stripe)
    const stripeGeo = new THREE.BoxGeometry(0.03, 0.06, 0.005);
    const stripeMat = new THREE.MeshStandardMaterial({ 
      color: 0x0000ff,
      roughness: 0.2
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.04, 0.026);
    mugGroup.add(stripe);

    mugGroup.position.set(x, y, z);
    return mugGroup;
  }

  // Paper coffee sleeves with company logos
  function createCoffeeSleeve(x, y, z) {
    const sleeveGroup = new THREE.Group();

    // Sleeve (cylinder segment)
    const sleeveGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16, 0, Math.PI*2, 0, Math.PI/2);
    const sleeveMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // brown
      roughness: 0.8
    });
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.position.set(0, 0.03, 0);
    sleeveGroup.add(sleeve);

    // Logo (simple circle)
    const logoGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.002, 16);
    const logoMat = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      roughness: 0.2
    });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(0.02, 0.03, 0.023);
    sleeveGroup.add(logo);

    sleeveGroup.position.set(x, y, z);
    return sleeveGroup;
  }

  // Add tableware to tables (positions on table tops)
  // Table 1: plastic cup, ceramic mug, coffee sleeve
  group.add(createPlasticCup(-2.5, 0.05, -1.2));
  group.add(createCeramicMug(-2.2, 0.05, -1.2));
  group.add(createCoffeeSleeve(-1.9, 0.05, -1.2));

  // Table 2: same
  group.add(createPlasticCup(2.2, 0.05, 1.2));
  group.add(createCeramicMug(2.5, 0.05, 1.2));
  group.add(createCoffeeSleeve(2.8, 0.05, 1.2));

  // Counter technology
  // Digital cash register with LCD display
  function createCashRegister(x, y, z) {
    const regGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.15, 0.1, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.05;
    regGroup.add(body);

    // LCD display
    const lcdGeo = new THREE.BoxGeometry(0.08, 0.04, 0.005);
    const lcdMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00, // green LCD
      emissive: 0x00ff00,
      emissiveIntensity: 1.5
    });
    const lcd = new THREE.Mesh(lcdGeo, lcdMat);
    lcd.position.set(0, 0.02, 0.0525); // slightly forward
    regGroup.add(lcd);

    // Keypad
    const keyGeo = new THREE.BoxGeometry(0.04, 0.005, 0.06);
    const keyMat = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.5
    });
    const keypad = new THREE.Mesh(keyGeo, keyMat);
    keypad.position.set(-0.04, -0.02, 0);
    regGroup.add(keypad);

    regGroup.position.set(x, y, z);
    return regGroup;
  }

  // Receipt printer with thermal paper
  function createReceiptPrinter(x, y, z) {
    const printerGroup = new THREE.Group();

    // Printer body
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.08, 0.06);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.04;
    printerGroup.add(body);

    // Paper roll (visible)
    const paperGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16);
    const paperMat = new THREE.MeshStandardMaterial({ 
      color: 0xfffff0,
      roughness: 0.3
    });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.position.set(0.04, 0.04, -0.02);
    printerGroup.add(paper);

    printerGroup.position.set(x, y, z);
    return printerGroup;
  }

  // Early POS terminal
  function createPOSTerminal(x, y, z) {
    const posGroup = new THREE.Group();

    // Terminal base
    const baseGeo = new THREE.BoxGeometry(0.1, 0.06, 0.08);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.03;
    posGroup.add(base);

    // Screen
    const screenGeo = new THREE.BoxGeometry(0.06, 0.04, 0.005);
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, // cyan
      emissive: 0x00ffff,
      emissiveIntensity: 1.2
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.01, 0.0425);
    posGroup.add(screen);

    // Keyboard
    const keyGeo = new THREE.BoxGeometry(0.08, 0.008, 0.04);
    const keyMat = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.5
    });
    const keyboard = new THREE.Mesh(keyGeo, keyMat);
    keyboard.position.set(0, -0.02, 0);
    posGroup.add(keyboard);

    posGroup.position.set(x, y, z);
    return posGroup;
  }

  // Credit card imprint machine
  function createImprinter(x, y, z) {
    const imprinterGroup = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.02;
    imprinterGroup.add(base);

    // Handle
    const handleGeo = new THREE.BoxGeometry(0.02, 0.06, 0.02);
    const handleMat = baseMat.clone();
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(-0.03, 0.05, 0);
    imprinterGroup.add(handle);

    // Imprint plate
    const plateGeo = new THREE.BoxGeometry(0.06, 0.002, 0.04);
    const plateMat = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.5
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.021, 0.031);
    imprinterGroup.add(plate);

    imprinterGroup.position.set(x, y, z);
    return imprinterGroup;
  }

  // Place counter technology on counter (left to right: register, printer, POS, imprinter)
  const cashRegister = createCashRegister(-0.6, 0.55, roomDepth/2 - 0.31);
  const receiptPrinter = createReceiptPrinter(-0.2, 0.55, roomDepth/2 - 0.31);
  const posTerminal = createPOSTerminal(0.2, 0.55, roomDepth/2 - 0.31);
  const imprinter = createImprinter(0.6, 0.55, roomDepth/2 - 0.31);
  group.add(cashRegister);
  group.add(receiptPrinter);
  group.add(posTerminal);
  group.add(imprinter);

  // Patrons (simplified as colored cylinders for bodies, spheres for heads)
  function createPatron(x, y, z, outfitColor, hairHeight = 0.15, accessories = []) {
    const patronGroup = new THREE.Group();

    // Body (suit with shoulder pads)
    const bodyGeo = new THREE.BoxGeometry(0.18, 0.35, 0.12);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: outfitColor,
      roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.175;
    patronGroup.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac, // skin tone
      roughness: 0.3
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.425;
    patronGroup.add(head);

    // Hair (big hair - teased/permed)
    const hairGeo = new THREE.SphereGeometry(0.1, 12, 12, 0, Math.PI*2, 0, Math.PI/2);
    const hairMat = new THREE.MeshStandardMaterial({ 
      color: 0x800080, // purple hair
      roughness: 0.4
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.475 + hairHeight/2;
    patronGroup.add(hair);

    // Shoulder pads (on blazer)
    const padGeo = new THREE.BoxGeometry(0.06, 0.02, 0.08);
    const padMat = new THREE.MeshStandardMaterial({ 
      color: outfitColor,
      roughness: 0.4
    });
    const leftPad = new THREE.Mesh(padGeo, padMat);
    leftPad.position.set(-0.09, 0.3, 0);
    patronGroup.add(leftPad);

    const rightPad = new THREE.Mesh(padGeo, padMat);
    rightPad.position.set(0.09, 0.3, 0);
    patronGroup.add(rightPad);

    // Accessories (e.g., sunglasses, walkie-talkie)
    accessories.forEach(acc => {
      patronGroup.add(acc);
    });

    patronGroup.position.set(x, y, z);
    return patronGroup;
  }

  // Create a few patrons
  // Patron 1: standing near table
  const patron1 = createPatron(-2.2, 0, -0.8, 0x000080, 0.2, [
    // Sunglasses
    (() => {
      const glassGeo = new THREE.TorusGeometry(0.02, 0.003, 8, 16, Math.PI);
      const glassMat = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        metalness: 0.8,
        roughness: 0.1
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, 0.42, 0.082);
      glass.rotation.y = Math.PI/2;
      return glass;
    })()
  ]);
  group.add(patron1);

  // Patron 2: sitting in booth
  const patron2 = createPatron(2.2, 0, 1.8, 0x8b0000, 0.18, [
    // Casio calculator (on table, but we'll attach to patron for simplicity)
    (() => {
      const calcGeo = new THREE.BoxGeometry(0.03, 0.02, 0.01);
      const calcMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.2
      });
      const calc = new THREE.Mesh(calcGeo, calcMat);
      calc.position.set(0.02, 0.08, 0);
      return calc;
    })()
  ]);
  group.add(patron2);

  // Lighting
  // Fluorescent ceiling tubes
  function createFluorescentTube(x, y, z, length = 0.8, width = 0.05) {
    const tubeGroup = new THREE.Group();

    const tubeGeo = new THREE.BoxGeometry(length, width, width);
    const tubeMat = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // fluorescent yellow
      emissive: 0xffff00,
      emissiveIntensity: 2
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.position.set(0, 0, 0);
    tubeGroup.add(tube);

    tubeGroup.position.set(x, y, z);
    return tubeGroup;
  }

  // Add two tubes across the ceiling
  const tube1 = createFluorescentTube(-1.5, roomHeight/2 - 0.02, 0, 0.6, 0.04);
  const tube2 = createFluorescentTube(1.5, roomHeight/2 - 0.02, 0, 0.6, 0.04);
  group.add(tube1);
  group.add(tube2);

  // Neon tube lights in geometric patterns (on walls)
  // We'll add some neon lines on the back wall as accent
  function createNeonTube(x, y, z, length = 0.3, width = 0.02, height = 0.02) {
    const tubeGeo = new THREE.BoxGeometry(length, width, height);
    const tubeMat = new THREE.MeshStandardMaterial({ 
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 3
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.position.set(0, 0, 0);
    return tube;
  }

  // Horizontal neon tubes on back wall
  const neon1 = createNeonTube(-2, roomHeight/2 - 0.5, -roomDepth/2 + 0.051, 0.8, 0.02, 0.02);
  const neon2 = createNeonTube(0, roomHeight/2 - 0.2, -roomDepth/2 + 0.051, 0.6, 0.02, 0.02);
  const neon3 = createNeonTube(2, roomHeight/2 - 0.5, -roomDepth/2 + 0.051, 0.8, 0.02, 0.02);
  group.add(neon1);
  group.add(neon2);
  group.add(neon3);

  // Track lighting with adjustable spotlights (from ceiling)
  function createSpotlight(x, y, z) {
    const lightGroup = new THREE.Group();

    // Track connector
    const connectorGeo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const connectorMat = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      metalness: 0.8,
      roughness: 0.1
    });
    const connector = new THREE.Mesh(connectorGeo, connectorMat);
    connector.position.set(0, 0, 0);
    lightGroup.add(connector);

    // Adjustable arm
    const armGeo = new THREE.BoxGeometry(0.1, 0.01, 0.01);
    const armMat = connectorMat.clone();
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.05, 0, 0);
    lightGroup.add(arm);

    // Light head
    const headGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.5
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.1, 0, 0);
    lightGroup.add(head);

    lightGroup.position.set(x, y, z);
    return lightGroup;
  }

  // Add two spotlights
  const spotlight1 = createSpotlight(-1, roomHeight/2 - 0.02, -0.5);
  const spotlight2 = createSpotlight(1, roomHeight/2 - 0.02, 0.5);
  group.add(spotlight1);
  group.add(spotlight2);

  // Warm accent lighting (wall sconces or table lamps)
  function createWallSconce(x, y, z) {
    const sconceGroup = new THREE.Group();

    // Base plate
    const baseGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0, 0);
    sconceGroup.add(base);

    // Arm
    const armGeo = new THREE.BoxGeometry(0.08, 0.008, 0.01);
    const armMat = baseMat.clone();
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.04, 0, 0);
    sconceGroup.add(arm);

    // Bulb (glass sphere)
    const bulbGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const bulbMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffe0,
      emissive: 0xffffe0,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0.08, 0, 0);
    sconceGroup.add(bulb);

    sconceGroup.position.set(x, y, z);
    return sconceGroup;
  }

  // Add two wall sconces
  const sconce1 = createWallSconce(-2.4, roomHeight/2 - 0.6, -roomDepth/2 + 0.051);
  const sconce2 = createWallSconce(2.4, roomHeight/2 - 0.6, -roomDepth/2 + 0.051);
  group.add(sconce1);
  group.add(sconce2);

  return group;
}