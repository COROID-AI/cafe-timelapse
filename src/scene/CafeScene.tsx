import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import TransitionController from "./TransitionController";
import CameraRig from "./CameraRig";
import Room from "./architecture/Room";
import LightingRig from "./architecture/LightingRig";
import Furniture from "./furniture/Furniture";
import BarCounter from "./bar/BarCounter";
import CoffeeStation from "./bar/CoffeeStation";
import CounterTech from "./bar/CounterTech";
import MenuBoard from "./bar/MenuBoard";
import Posters from "./decor/Posters";
import Signage from "./decor/Signage";
import Tableware from "./decor/Tableware";
import MusicCorner from "./decor/MusicCorner";
import Patrons from "./patrons/Patrons";

/**
 * Single Canvas root (plan convention). Post-processing is deliberately
 * omitted for frame budget (finding d25328b1): emissive fixtures plus
 * ACES tonemapping deliver glow without a full-screen composer pass.
 */
export default function CafeScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.5, 3.2, 8.8], fov: 50 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
      }}
    >
      <color attach="background" args={["#100c09"]} />
      <fog attach="fog" args={["#100c09", 16, 34]} />

      {/* Drives era blending; renders nothing itself */}
      <TransitionController />
      <CameraRig />
      <LightingRig />

      <Room />
      <Furniture />

      <BarCounter />
      <CoffeeStation />
      <CounterTech />
      <MenuBoard />

      <Posters />
      <Signage />
      <Tableware />
      <MusicCorner />

      <Patrons />
    </Canvas>
  );
}
