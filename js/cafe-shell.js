/**
 * CafeShell — builds the shared, period-independent interior architecture:
 * floor, ceiling, four walls, windows on the side walls, and a front door.
 * Every period module decorates on top of this base shell.
 */

/* THREE is provided globally via the importmap CDN script. */
(function () {
  const { CAFE_DIMENSIONS } = window.Cafe;

  class CafeShell {
    constructor(scene) {
      this.scene = scene;
      this.group = new THREE.Group();
      this.group.name = "CafeShell";
      this._build();
      this.scene.add(this.group);
    }

    _build() {
      const { width, depth, height } = CAFE_DIMENSIONS;
      const hw = width / 2; // half-width
      const hd = depth / 2; // half-depth

      this._buildFloor(hw, hd);
      this._buildCeiling(hw, hd, height);
      this._buildWalls(hw, hd, height);
      this._buildWindows(hw, hd, height);
      this._buildFrontDoor(hw, hd, height);
    }

    // ---------- Floor ----------
    _buildFloor(hw, hd) {
      const geo = new THREE.PlaneGeometry(hw * 2, hd * 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6b5a48,
        roughness: 0.85,
        metalness: 0.05,
      });
      const floor = new THREE.Mesh(geo, mat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      floor.name = "floor";
      this.group.add(floor);
    }

    // ---------- Ceiling ----------
    _buildCeiling(hw, hd, height) {
      const geo = new THREE.PlaneGeometry(hw * 2, hd * 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xe8e2d5,
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      const ceiling = new THREE.Mesh(geo, mat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = height;
      ceiling.receiveShadow = true;
      ceiling.name = "ceiling";
      this.group.add(ceiling);
    }

    // ---------- Walls ----------
    _buildWalls(hw, hd, height) {
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xc4b89e,
        roughness: 0.9,
        metalness: 0.0,
      });

      // Back wall (positive Z)
      const backWall = this._makeWall(hw * 2, height, wallMat);
      backWall.position.set(0, height / 2, hd);
      backWall.name = "wall-back";
      this.group.add(backWall);

      // Front wall (negative Z) — door opening cut separately
      const frontWall = this._makeWall(hw * 2, height, wallMat);
      frontWall.position.set(0, height / 2, -hd);
      frontWall.name = "wall-front";
      this.group.add(frontWall);

      // Left wall (negative X)
      const leftWall = this._makeWall(hd * 2, height, wallMat);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(-hw, height / 2, 0);
      leftWall.name = "wall-left";
      this.group.add(leftWall);

      // Right wall (positive X)
      const rightWall = this._makeWall(hd * 2, height, wallMat);
      rightWall.rotation.y = Math.PI / 2;
      rightWall.position.set(hw, height / 2, 0);
      rightWall.name = "wall-right";
      this.group.add(rightWall);
    }

    _makeWall(w, h, mat) {
      const geo = new THREE.PlaneGeometry(w, h);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      return mesh;
    }

    // ---------- Windows ----------
    /**
     * Adds window-frame outlines and translucent glass panes to both side walls.
     * Windows are positioned at a comfortable viewing height.
     */
    _buildWindows(hw, hd, height) {
      const winWidth = 2.4;
      const winHeight = 1.8;
      const winY = 1.8; // center height from floor
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xa8c8e0,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x4a3c2e,
        roughness: 0.7,
      });

      // Three windows per side wall, evenly spaced along Z.
      const zPositions = [-4.5, 0, 4.5];

      for (const side of [-1, 1]) {
        for (const z of zPositions) {
          // Glass pane
          const glassGeo = new THREE.PlaneGeometry(winWidth, winHeight);
          const glass = new THREE.Mesh(glassGeo, glassMat);
          glass.position.set(side * hw, winY, z);
          glass.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
          glass.name = `window-glass-${side}-${z}`;
          this.group.add(glass);

          // Frame (thin border boxes)
          const frameThickness = 0.08;
          const frameDepth = 0.1;
          // Top frame
          const frameTop = new THREE.Mesh(
            new THREE.BoxGeometry(frameDepth, frameThickness, winWidth + frameThickness * 2),
            frameMat
          );
          frameTop.position.set(side * hw, winY + winHeight / 2 + frameThickness / 2, z);
          this.group.add(frameTop);
          // Bottom frame (sill)
          const frameBottom = new THREE.Mesh(
            new THREE.BoxGeometry(frameDepth, frameThickness, winWidth + frameThickness * 2),
            frameMat
          );
          frameBottom.position.set(side * hw, winY - winHeight / 2 - frameThickness / 2, z);
          this.group.add(frameBottom);
        }
      }
    }

    // ---------- Front Door ----------
    /**
     * Places a door frame and panel on the front wall (negative Z side).
     */
    _buildFrontDoor(hw, hd, height) {
      const doorWidth = 1.2;
      const doorHeight = 2.4;
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x5a4632,
        roughness: 0.6,
        metalness: 0.1,
      });
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x3a2e22,
        roughness: 0.7,
      });

      // Door panel
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, 0.08),
        doorMat
      );
      door.position.set(0, doorHeight / 2, -hd + 0.02);
      door.castShadow = true;
      door.name = "front-door";
      this.group.add(door);

      // Door frame — two side posts + lintel
      const postW = 0.1;
      const postD = 0.12;
      const lintelH = 0.1;

      const postLeft = new THREE.Mesh(
        new THREE.BoxGeometry(postW, doorHeight + lintelH, postD),
        frameMat
      );
      postLeft.position.set(-doorWidth / 2 - postW / 2, (doorHeight + lintelH) / 2, -hd + 0.02);
      this.group.add(postLeft);

      const postRight = new THREE.Mesh(
        new THREE.BoxGeometry(postW, doorHeight + lintelH, postD),
        frameMat
      );
      postRight.position.set(doorWidth / 2 + postW / 2, (doorHeight + lintelH) / 2, -hd + 0.02);
      this.group.add(postRight);

      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + postW * 2, lintelH, postD),
        frameMat
      );
      lintel.position.set(0, doorHeight + lintelH / 2, -hd + 0.02);
      this.group.add(lintel);
    }
  }

  window.Cafe = window.Cafe || {};
  window.Cafe.CafeShell = CafeShell;
})();
