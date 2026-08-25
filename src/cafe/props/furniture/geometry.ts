import * as THREE from 'three';

type GeoFactory = () => THREE.BufferGeometry;

/**
 * Deduplicating geometry cache for one era set.
 *
 * Keeps polycount and draw preparation reasonable: repeated primitives
 * (chair legs, lino tiles, doilies…) share a single buffer, and `dispose()`
 * releases everything the set owns in one call.
 */
export class GeometryCache {
  private readonly entries = new Map<string, THREE.BufferGeometry>();

  get(key: string, factory: GeoFactory): THREE.BufferGeometry {
    let geometry = this.entries.get(key);
    if (!geometry) {
      geometry = factory();
      this.entries.set(key, geometry);
    }
    return geometry;
  }

  unitBox(): THREE.BufferGeometry {
    return this.get('box:unit', () => new THREE.BoxGeometry(1, 1, 1));
  }

  cylinder(rTop: number, rBottom: number, h: number, seg: number): THREE.BufferGeometry {
    const key = `cyl:${rTop},${rBottom},${h},${seg}`;
    return this.get(key, () => new THREE.CylinderGeometry(rTop, rBottom, h, seg));
  }

  cylinderOpen(
    rTop: number,
    rBottom: number,
    h: number,
    seg: number,
    thetaStart: number,
    thetaLength: number,
  ): THREE.BufferGeometry {
    const key = `cylo:${rTop},${rBottom},${h},${seg},${thetaStart},${thetaLength}`;
    return this.get(
      key,
      () =>
        new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, true, thetaStart, thetaLength),
    );
  }

  sphere(r: number, w = 10, hs = 8): THREE.BufferGeometry {
    return this.get(`sph:${r},${w},${hs}`, () => new THREE.SphereGeometry(r, w, hs));
  }

  torus(r: number, tube: number, radial = 8, tubular = 16, arc = Math.PI * 2): THREE.BufferGeometry {
    return this.get(`tor:${r},${tube},${radial},${tubular},${arc}`, () =>
      new THREE.TorusGeometry(r, tube, radial, tubular, arc),
    );
  }

  ring(inner: number, outer: number, seg = 24): THREE.BufferGeometry {
    return this.get(`ring:${inner},${outer},${seg}`, () =>
      new THREE.RingGeometry(inner, outer, seg),
    );
  }

  circle(r: number, seg = 28): THREE.BufferGeometry {
    return this.get(`cir:${r},${seg}`, () => new THREE.CircleGeometry(r, seg));
  }

  cone(r: number, h: number, seg = 6): THREE.BufferGeometry {
    return this.get(`cone:${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
  }

  /** Half-disc extruded arch (jukebox crown). Shape lives in XY, depth along +Z. */
  extrudedArch(radius: number, depth: number): THREE.BufferGeometry {
    const key = `arch:${radius},${depth}`;
    return this.get(key, () => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, radius, 0, Math.PI, false);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
        curveSegments: 14,
      });
      geometry.translate(0, 0, -depth / 2);
      return geometry;
    });
  }

  dispose(): void {
    for (const geometry of this.entries.values()) geometry.dispose();
    this.entries.clear();
  }
}

/** Shared build dependencies handed to every piece/decor constructor. */
export interface PieceDeps {
  geo: GeometryCache;
}

function finalize(mesh: THREE.Mesh, name?: string): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  return mesh;
}

/** Scaled unit-cube mesh (cheap boxes share one geometry). */
export function boxMesh(
  deps: PieceDeps,
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  name?: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(deps.geo.unitBox(), material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  return finalize(mesh, name);
}

/** Cached cylinder mesh. */
export function cylMesh(
  deps: PieceDeps,
  material: THREE.Material,
  rTop: number,
  rBottom: number,
  h: number,
  seg: number,
  x: number,
  y: number,
  z: number,
  name?: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(deps.geo.cylinder(rTop, rBottom, h, seg), material);
  mesh.position.set(x, y, z);
  return finalize(mesh, name);
}
