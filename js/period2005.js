// 2005 Café Interior - Three.js Scene Builder
// Returns a THREE.Group containing all 2005 era specific objects

/**
 * Creates a group containing all 2005 era café items
 * @returns {THREE.Group} Group containing 2005 era objects
 */
function create2005Scene() {
  const group = new THREE.Group();

  // Constants for sizing and positioning
  const roomWidth = 8;
  const roomDepth = 6;
  const roomHeight = 3;

  // Helper function to create a simple box (for furniture bases)
  function createBox(width, height, depth, color, opacity = 1) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ 
      color: color,
      opacity: opacity,
      transparent: opacity < 1
    });
    return new THREE.Mesh(geo, mat);
  }

  // Helper function to create a cylinder (for legs, poles, etc.)
  function createCylinder(radiusTop, radiusBottom, height, radialSegments, color) {
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    const mat = new THREE.MeshStandardMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  // Helper function to create a textured rectangle (for posters, menus, etc.)
  function createTexturedPlane(width, height, color, opacity = 1) {
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshStandardMaterial({ 
      color: color,
      opacity: opacity,
      transparent: opacity < 1,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geo, mat);
  }

  // === FURNITURE & DECOR ===

  // Exposed brick wall (accent wall)
  function createBrickWall(x, y, z, width = 3, height = 2) {
    const wall = createTexturedPlane(width, height, 0x8b4513, 1.0); // saddle brown for brick
    wall.position.set(x, y + height/2, z);
    wall.rotation.y = Math.PI / 2; // face outward
    return wall;
  }

  // Industrial-style wooden table (simple design with metal legs)
  function createIndustrialTable(x, y, z, width = 1.5, depth = 1.5) {
    const tableGroup = new THREE.Group();

    // Tabletop (wood)
    const top = createBox(width, 0.05, depth, 0x8b4513); // saddle brown
    top.position.y = 0.025;
    tableGroup.add(top);

    // Metal legs (four corners)
    const legHeight = 0.7;
    const legSize = 0.05;
    const positions = [
      [-width/2 + legSize/2, -depth/2 + legSize/2],
      [width/2 - legSize/2, -depth/2 + legSize/2],
      [-width/2 + legSize/2, depth/2 - legSize/2],
      [width/2 - legSize/2, depth/2 - legSize/2]
    ];
    positions.forEach(([fx, fz]) => {
      const leg = createCylinder(legSize, legSize, legHeight, 8, 0xc0c0c0); // silver
      leg.position.set(x + fx, y - roomHeight/2 + legHeight/2, z + fz);
      tableGroup.add(leg);
    });

    tableGroup.position.set(x, y, z);
    return tableGroup;
  }

  // Wrought-iron chair (simple design)
  function createWroughtIronChair(x, y, z) {
    const chairGroup = new THREE.Group();

    // Seat
    const seat = createBox(0.4, 0.05, 0.4, 0x8b4513); // dark brown
    seat.position.y = 0.425;
    chairGroup.add(seat);

    // Backrest
    const back = createBox(0.4, 0.3, 0.05, 0x8b4513);
    back.position.set(0, 0.575, -0.2);
    chairGroup.add(back);

    // Legs (four legs)
    const legHeight = 0.4;
    const legSize = 0.05;
    const legPositions = [
      [-0.15, -0.15],
      [0.15, -0.15],
      [-0.15, 0.15],
      [0.15, 0.15]
    ];
    legPositions.forEach(([fx, fz]) => {
      const leg = createCylinder(legSize, legSize, legHeight, 8, 0x8b4513);
      leg.position.set(x + fx, y - roomHeight/2 + legHeight/2, z + fz);
      chairGroup.add(leg);
    });

    chairGroup.position.set(x, y, z);
    return chairGroup;
  }

  // Vintage barn wood accent (plank on wall)
  function createBarnWoodAccent(x, y, z, width = 1.5, height = 0.2) {
    const plank = createBox(width, height, 0.05, 0x8b4513); // wood color
    plank.position.set(x, y + height/2, z);
    plank.rotation.y = Math.PI / 2; // face outward
    return plank;
  }

  // Vinyl record display (shelf with records)
  function createVinylRecordDisplay(x, y, z, width = 1.2, height = 0.8) {
    const shelfGroup = new THREE.Group();

    // Shelf
    const shelf = createBox(width, 0.05, 0.3, 0x654321); // dark wood
    shelf.position.set(x, y + height/2, z);
    shelfGroup.add(shelf);

    // Records (cylinders)
    const recordRadius = 0.15;
    const recordHeight = 0.02;
    const recordCount = 5;
    const spacing = width / (recordCount + 1);
    for (let i = 0; i < recordCount; i++) {
      const record = createCylinder(recordRadius, recordRadius, recordHeight, 32, 0x000000); // black
      record.position.set(
        x - width/2 + spacing * (i + 1),
        y + height/2 + recordHeight/2,
        z + 0.15
      );
      record.rotation.x = Math.PI / 2; // flat
      shelfGroup.add(record);
    }

    shelfGroup.position.set(x, y, z);
    return shelfGroup;
  }

  // === COFFEE EQUIPMENT ===

  // Espresso machine (simplified)
  function createEspressoMachine(x, y, z, width = 0.6, height = 0.5, depth = 0.4) {
    const machineGroup = new THREE.Group();

    // Main body
    const body = createBox(width, height, depth, 0xc0c0c0); // silver
    body.position.set(x, y + height/2, z);
    machineGroup.add(body);

    // Portafilters (two)
    const portafilterWidth = 0.1;
    const portafilterHeight = 0.2;
    const portafilterDepth = 0.1;
    const portafilterY = y + height - portafilterHeight/2;
    const portafilterZ = z - depth/2 + portafilterDepth/2;
    const pf1 = createBox(portafilterWidth, portafilterHeight, portafilterDepth, 0x654321);
    pf1.position.set(x - width/4, portafilterY, portafilterZ);
    machineGroup.add(pf1);
    const pf2 = createBox(portafilterWidth, portafilterHeight, portafilterDepth, 0x654321);
    pf2.position.set(x + width/4, portafilterY, portafilterZ);
    machineGroup.add(pf2);

    // Steam wand
    const wandHeight = 0.3;
    const wand = createCylinder(0.02, 0.02, wandHeight, 8, 0xc0c0c0);
    wand.position.set(x + width/2 - 0.05, y + height - wandHeight/2, z);
    machineGroup.add(wand);

    machineGroup.position.set(x, y, z);
    return machineGroup;
  }

  // Grinder with dosing chamber
  function createGrinder(x, y, z, width = 0.2, height = 0.4, depth = 0.2) {
    const grinderGroup = new THREE.Group();

    // Hopper (cone)
    const hopperRadius = 0.1;
    const hopperHeight = 0.2;
    const hopper = new THREE.Mesh(
      new THREE.ConeGeometry(hopperRadius, hopperHeight, 8),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    hopper.position.set(x, y + height - hopperHeight/2, z);
    grinderGroup.add(hopper);

    // Doser chamber (box)
    const doser = createBox(width, height * 0.6, depth, 0x654321);
    doser.position.set(x, y + height * 0.3, z);
    grinderGroup.add(doser);

    // Handle
    const handle = createCylinder(0.02, 0.02, 0.1, 8, 0xc0c0c0);
    handle.position.set(x + width/2, y + height * 0.3, z);
    grinderGroup.add(handle);

    grinderGroup.position.set(x, y, z);
    return grinderGroup;
  }

  // Pour-over setup
  function createPourOverSetup(x, y, z) {
    const setupGroup = new THREE.Group();

    // Stand
    const stand = createCylinder(0.02, 0.02, 0.3, 8, 0xc0c0c0);
    stand.position.set(x, y + 0.15, z);
    setupGroup.add(stand);

    // Dripper (cone)
    const dripper = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    dripper.position.set(x, y + 0.3, z);
    setupGroup.add(dripper);

    // Carafe (cylinder)
    const carafe = createCylinder(0.05, 0.05, 0.2, 8, 0x654321);
    carafe.position.set(x + 0.15, y + 0.1, z);
    setupGroup.add(carafe);

    setupGroup.position.set(x, y, z);
    return setupGroup;
  }

  // Coffee bean bags
  function createCoffeeBag(x, y, z, width = 0.1, height = 0.15, depth = 0.05) {
    const bag = createBox(width, height, depth, 0x8b4513); // brown
    bag.position.set(x, y + height/2, z);
    return bag;
  }

  // === MENU & PRICES ===

  // Menu board
  function createMenuBoard(x, y, z, width = 1.2, height = 0.8) {
    const board = createTexturedPlane(width, height, 0x000000, 1.0); // blackboard
    board.position.set(x, y + height/2, z);
    board.rotation.y = Math.PI / 2; // face outward
    return board;
  }

  // === AUDIO SETUP ===

  // iPod + dock station
  function createIPodDock(x, y, z) {
    const dockGroup = new THREE.Group();

    // Dock
    const dock = createBox(0.2, 0.05, 0.1, 0xc0c0c0); // silver
    dock.position.set(x, y + 0.025, z);
    dockGroup.add(dock);

    // iPod
    const ipod = createBox(0.12, 0.06, 0.005, 0x000000); // black
    ipod.position.set(x, y + 0.05 + 0.0025, z + 0.05);
    dockGroup.add(ipod);

    dockGroup.position.set(x, y, z);
    return dockGroup;
  }

  // === POSTERS & SIGNAGE ===

  // Indie music band poster
  function createBandPoster(x, y, z, width = 0.6, height = 0.8) {
    const poster = createTexturedPlane(width, height, 0x800080); // purple
    poster.position.set(x, y + height/2, z);
    poster.rotation.y = Math.PI / 2;
    return poster;
  }

  // Artistic print
  function createArtPrint(x, y, z, width = 0.5, height = 0.7) {
    const print = createTexturedPlane(width, height, 0xffffff); // white
    print.position.set(x, y + height/2, z);
    print.rotation.y = Math.PI / 2;
    return print;
  }

  // Certification decal
  function createDecal(x, y, z, size = 0.2) {
    const decal = createTexturedPlane(size, size, 0x008000); // green
    decal.position.set(x, y + size/2, z);
    decal.rotation.y = Math.PI / 2;
    return decal;
  }

  // Free Wi-Fi window decal
  function createWifiDecal(x, y, z, size = 0.3) {
    const decal = createTexturedPlane(size, size, 0x0000ff); // blue
    decal.position.set(x, y + size/2, z);
    decal.rotation.y = Math.PI / 2;
    return decal;
  }

  // Handwritten chalkboard specials
  function createChalkboardSpecials(x, y, z, width = 0.8, height = 0.4) {
    const board = createTexturedPlane(width, height, 0x000000, 0.8); // semi-transparent black
    board.position.set(x, y + height/2, z);
    board.rotation.y = Math.PI / 2;
    return board;
  }

  // === TABLEWARE ===

  // Glass mug
  function createGlassMug(x, y, z, radius = 0.06, height = 0.08) {
    const mugGroup = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xadd8e6, // light blue
        transparent: true,
        opacity: 0.8
      })
    );
    body.position.y = height/2;
    mugGroup.add(body);

    // Handle (simplified as a torus)
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.005, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.8 })
    );
    handle.position.set(radius + 0.02, height/2, 0);
    handle.rotation.x = Math.PI / 2;
    mugGroup.add(handle);

    mugGroup.position.set(x, y, z);
    return mugGroup;
  }

  // Ceramic coffee cup with café branding
  function createCeramicCup(x, y, z, radius = 0.05, height = 0.07) {
    const cupGroup = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    body.position.y = height/2;
    cupGroup.add(body);

    // Handle
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.015, 0.003, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    handle.position.set(radius + 0.015, height/2, 0);
    handle.rotation.x = Math.PI / 2;
    cupGroup.add(handle);

    // Simple branding (a dot)
    const brand = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    brand.position.set(0, height/2, radius);
    cupGroup.add(brand);

    cupGroup.position.set(x, y, z);
    return cupGroup;
  }

  // Reusable cotton napkin
  function createNapkin(x, y, z, width = 0.1, height = 0.1) {
    const napkin = createTexturedPlane(width, height, 0xfffff0); // off-white
    napkin.position.set(x, y + height/2, z);
    return napkin;
  }

  // Sugar packet organizer
  function createSugarOrganizer(x, y, z, width = 0.15, height = 0.1, depth = 0.1) {
    const organizer = createBox(width, height, depth, 0xffd700); // gold
    organizer.position.set(x, y + height/2, z);
    return organizer;
  }

  // Plastic-lid to-go cup
  function createToGoCup(x, y, z, radius = 0.04, height = 0.1) {
    const cupGroup = new THREE.Group();

    // Cup
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    cup.position.y = height/2;
    cupGroup.add(cup);

    // Lid
    const lid = createBox(radius*2, 0.02, radius*2, 0xc0c0c0);
    lid.position.set(0, height + 0.01, 0);
    cupGroup.add(lid);

    // Straw
    const straw = createCylinder(0.005, 0.005, 0.15, 8, 0xff0000);
    straw.position.set(0, height + 0.02 + 0.075, 0);
    cupGroup.add(straw);

    cupGroup.position.set(x, y, z);
    return cupGroup;
  }

  // === COUNTER TECHNOLOGY ===

  // Modern POS system with touch screen
  function createPosSystem(x, y, z, width = 0.3, height = 0.2, depth = 0.05) {
    const posGroup = new THREE.Group();

    // Touch screen
    const screen = createTexturedPlane(width, height, 0x00ff00); // green (simulated)
    screen.position.set(0, height/2, depth/2);
    posGroup.add(screen);

    // Base
    const base = createBox(width, height*0.3, depth, 0x654321);
    base.position.set(0, -height*0.35, 0);
    posGroup.add(base);

    posGroup.position.set(x, y, z);
    return posGroup;
  }

  // Magnetic stripe card reader
  function createCardReader(x, y, z, width = 0.1, height = 0.05, depth = 0.02) {
    const reader = createBox(width, height, depth, 0x000000);
    reader.position.set(x, y + height/2, z);
    return reader;
  }

  // Receipt printer
  function createReceiptPrinter(x, y, z, width = 0.15, height = 0.1, depth = 0.1) {
    const printer = createBox(width, height, depth, 0xc0c0c0);
    printer.position.set(x, y + height/2, z);
    return printer;
  }

  // Early mobile phone for orders
  function createMobilePhone(x, y, z, width = 0.08, height = 0.15, depth = 0.02) {
    const phone = createBox(width, height, depth, 0x000000);
    phone.position.set(x, y + height/2, z);
    return phone;
  }

  // === PATRONS ===

  // Simplified patron with emo/scene hair, skinny jeans, etc.
  function createPatron(x, y, z, height = 1.6) {
    const patronGroup = new THREE.Group();

    // Body (simple column)
    const body = createBox(0.4, height*0.6, 0.2, 0x0000ff); // blue shirt
    body.position.set(0, height*0.3, 0);
    patronGroup.add(body);

    // Head
    const headRadius = 0.1;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffdab9 }) // peach
    );
    head.position.set(0, height*0.8, 0);
    patronGroup.add(head);

    // Hair (emo/side-swept bangs - we'll use a weird shape)
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius*1.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x000000 }) // black
    );
    hair.position.set(0, height*0.85, -headRadius*0.5);
    patronGroup.add(hair);

    // Legs (skinny jeans)
    const legWidth = 0.15;
    const legHeight = height*0.4;
    const legLeft = createBox(legWidth, legHeight, 0.2, 0x0000ff); // blue jeans
    legLeft.position.set(-0.1, -height*0.2, 0);
    patronGroup.add(legLeft);
    const legRight = createBox(legWidth, legHeight, 0.2, 0x0000ff);
    legRight.position.set(0.1, -height*0.2, 0);
    patronGroup.add(legRight);

    // Feet (Converse shoes)
    const shoeSize = 0.1;
    const shoeHeight = 0.05;
    const shoeLeft = createBox(shoeSize, shoeHeight, shoeSize*1.5, 0x000000);
    shoeLeft.position.set(-0.1, -height*0.5 + shoeHeight/2, 0);
    patronGroup.add(shoeLeft);
    const shoeRight = createBox(shoeSize, shoeHeight, shoeSize*1.5, 0x000000);
    shoeRight.position.set(0.1, -height*0.5 + shoeHeight/2, 0);
    patronGroup.add(shoeRight);

    // Accessories: flip phone in hand
    const phone = createBox(0.05, 0.08, 0.01, 0x808080);
    phone.position.set(0.25, height*0.5, -0.1);
    patronGroup.add(phone);

    // iPod Nano in ears (tiny rectangles)
    const earbudLeft = createBox(0.01, 0.01, 0.02, 0x000000);
    earbudLeft.position.set(-headRadius*0.8, height*0.85, headRadius*0.5);
    patronGroup.add(earbudLeft);
    const earbudRight = createBox(0.01, 0.01, 0.02, 0x000000);
    earbudRight.set(headRadius*0.8, height*0.85, headRadius*0.5);
    patronGroup.add(earbudRight);

    patronGroup.position.set(x, y, z);
    return patronGroup;
  }

  // === LIGHTING ===

  // Edison bulb pendant light
  function createEdisonPendant(x, y, z, cordLength = 0.5) {
    const lightGroup = new THREE.Group();

    // Cord
    const cord = createCylinder(0.01, 0.01, cordLength, 8, 0x000000);
    cord.position.y = -cordLength/2;
    lightGroup.add(cord);

    // Edison bulb (elongated sphere with warm color)
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 0.08, 12, 12),
      new THREE.MeshStandardMaterial({ 
        color: 0xffd700, // warm yellow
        emissive: 0xffd700,
        emissiveIntensity: 0.5
      })
    );
    bulb.position.y = -cordLength - 0.06;
    lightGroup.add(bulb);

    lightGroup.position.set(x, y, z);
    return lightGroup;
  }

  // Track lighting with tungsten spots
  function createTrackLight(x, y, z, trackLength = 1.5, spotCount = 3) {
    const trackGroup = new THREE.Group();

    // Track
    const track = createBox(trackLength, 0.05, 0.05, 0x654321);
    track.position.set(0, 0, 0);
    trackGroup.add(track);

    // Spots
    const spotSpacing = trackLength / (spotCount + 1);
    for (let i = 0; i < spotCount; i++) {
      const spot = createCylinder(0.03, 0.01, 0.1, 8, 0xc0c0c0);
      spot.position.set(
        -trackLength/2 + spotSpacing * (i + 1),
        -0.025, // slightly below track
        0
      );
      spot.rotation.x = Math.PI / 2; // point down
      trackGroup.add(spot);
    }

    trackGroup.position.set(x, y, z);
    return trackGroup;
  }

  // Under-counter LED strips
  function createUnderCounterLED(x, y, z, length = 1.5, width = 0.02) {
    const led = createBox(length, width, 0.01, 0x00ff00); // greenish for LED
    led.position.set(x, y + width/2, z);
    return led;
  }

  // Warm incandescent accent lights
  function createAccentLight(x, y, z, size = 0.05) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xffa500, // orange
        emissive: 0xffa500,
        emissiveIntensity: 0.3
      })
    );
    light.position.set(x, y, z);
    return light;
  }

  // === BUILD THE SCENE ===

  // Add exposed brick wall (accent wall on one side)
  const brickWall = createBrickWall(-roomWidth/2, roomHeight/2, -roomDepth/2);
  group.add(brickWall);

  // Add industrial-style wooden tables
  const table1 = createIndustrialTable(-2, 0, -1);
  const table2 = createIndustrialTable(2, 0, 1);
  group.add(table1);
  group.add(table2);

  // Add wrought-iron chairs
  const chair1 = createWroughtIronChair(-2.5, 0, -1.5);
  const chair2 = createWroughtIronChair(2.5, 0, 1.5);
  group.add(chair1);
  group.add(chair2);

  // Add barn wood accent
  const barnWood = createBarnWoodAccent(0, 1, -roomDepth/2 + 0.1);
  group.add(barnWood);

  // Add vinyl record display
  const vinylDisplay = createVinylRecordDisplay(-roomWidth/2 + 0.2, 0.5, -roomDepth/2 + 0.1);
  group.add(vinylDisplay);

  // === COUNTER AREA ===
  const counterY = -roomHeight/2 + 0.01; // just above floor
  const counterZ = roomDepth/2 - 0.1; // near back wall

  // Espresso machine
  const espresso = createEspressoMachine(-1.5, counterY, counterZ);
  group.add(espresso);

  // Grinder
  const grinder = createGrinder(-1.2, counterY, counterZ);
  group.add(grinder);

  // Pour-over setup
  const pourOver = createPourOverSetup(-0.5, counterY, counterZ);
  group.add(pourOver);

  // Coffee bean bags
  const bag1 = createCoffeeBag(-0.2, counterY, counterZ);
  const bag2 = createCoffeeBag(0.0, counterY, counterZ);
  const bag3 = createCoffeeBag(0.2, counterY, counterZ);
  group.add(bag1);
  group.add(bag2);
  group.add(bag3);

  // Menu board
  const menuBoard = createMenuBoard(-roomWidth/2 + 0.2, 1, counterZ - 0.1);
  group.add(menuBoard);

  // iPod dock
  const ipodDock = createIPodDock(1.5, counterY, counterZ);
  group.add(ipodDock);

  // Posters and signage
  const bandPoster = createBandPoster(-roomWidth/2 + 0.2, 1.5, -roomDepth/2 + 0.1);
  group.add(bandPoster);
  const artPrint = createArtPrint(0, 1.5, -roomDepth/2 + 0.1);
  group.add(artPrint);
  const decal = createDecal(1, 1.5, -roomDepth/2 + 0.1);
  group.add(decal);
  const wifiDecal = createWifiDecal(1.5, 1.5, -roomDepth/2 + 0.1);
  group.add(wifiDecal);
  const chalkboard = createChalkboardSpecials(-roomWidth/2 + 0.2, 0.5, counterZ - 0.1);
  group.add(chalkboard);

  // Tableware on tables
  const mug1 = createGlassMug(-2, 0.06, -1);
  const mug2 = createGlassMug(2, 0.06, 1);
  group.add(mug1);
  group.add(mug2);
  const cup1 = createCeramicCup(-2, 0.06, -1.1);
  const cup2 = createCeramicCup(2, 0.06, 1.1);
  group.add(cup1);
  group.add(cup2);
  const napkin1 = createNapkin(-2, 0.06, -1.2);
  const napkin2 = createNapkin(2, 0.06, 1.2);
  group.add(napkin1);
  group.add(napkin2);
  const sugar1 = createSugarOrganizer(-2, 0.06, -1.3);
  const sugar2 = createSugarOrganizer(2, 0.06, 1.3);
  group.add(sugar1);
  group.add(sugar2);
  const togo1 = createToGoCup(-2, 0.06, -1.4);
  const togo2 = createToGoCup(2, 0.06, 1.4);
  group.add(togo1);
  group.add(togo2);

  // Counter technology
  const pos = createPosSystem(1.2, counterY, counterZ);
  group.add(pos);
  const cardReader = createCardReader(0.8, counterY, counterZ);
  group.add(cardReader);
  const receiptPrinter = createReceiptPrinter(0.5, counterY, counterZ);
  group.add(receiptPrinter);
  const mobilePhone = createMobilePhone(0.2, counterY, counterZ);
  group.add(mobilePhone);

  // Patrons
  const patron1 = createPatron(-3, 0, -2);
  const patron2 = createPatron(3, 0, 2);
  group.add(patron1);
  group.add(patron2);

  // Lighting
  // Pendant lights over tables
  const pendant1 = createEdisonPendant(-2, roomHeight/2 - 0.1, -1);
  const pendant2 = createEdisonPendant(2, roomHeight/2 - 0.1, 1);
  group.add(pendant1);
  group.add(pendant2);

  // Track lighting
  const trackLight = createTrackLight(0, roomHeight/2 - 0.1, 0);
  group.add(trackLight);

  // Under-counter LED
  const underLed = createUnderCounterLED(0, counterY + 0.01, counterZ);
  group.add(underLed);

  // Accent lights
  const accent1 = createAccentLight(-roomWidth/2 + 0.2, roomHeight/2 - 0.2, -roomDepth/2 + 0.2);
  const accent2 = createAccentLight(roomWidth/2 - 0.2, roomHeight/2 - 0.2, -roomDepth/2 + 0.2);
  group.add(accent1);
  group.add(accent2);

  return group;
}

// Export the function
if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
  module.exports = { create2005Scene };
} else {
  window.create2005Scene = create2005Scene;
}