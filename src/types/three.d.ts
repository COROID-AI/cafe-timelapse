/// <reference types="@react-three/fiber" />

// Intentionally loosens JSX intrinsic elements typing so react-three-fiber
// primitives (mesh, group, geometries, materials) compile under Next.js.
// (This project uses react-three-fiber JSX heavily across model components.)

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
