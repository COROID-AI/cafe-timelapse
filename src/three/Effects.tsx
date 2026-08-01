import { useMemo } from 'react';
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  SSAO,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { EraConfig } from '../types/era';
import { lerp } from '../utils/interpolation';

interface EffectsProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

/**
 * Postprocessing stack: bloom, SSAO, depth-of-field, vignette, tonemapping
 * and subtle chromatic aberration. Each effect's strength interpolates with
 * the era mood. Under reduced motion the stronger/animating effects are
 * damped so the scene stays calm.
 *
 * SSAO requires the NormalPass, which is enabled via EffectComposer's
 * `enableNormalPass` (postprocessing v6 API).
 */
export function Effects({ from, to, progress }: EffectsProps) {
  const reduced = useMemo(
    () => document.documentElement.dataset.reducedMotion === 'true',
    [],
  );
  const mood = useMemo(() => {
    return {
      bloom: lerp(from.atmosphere.bloom, to.atmosphere.bloom, progress) * (reduced ? 0.5 : 1),
      vignette: lerp(from.atmosphere.vignette, to.atmosphere.vignette, progress) * (reduced ? 0.4 : 1),
      dof: lerp(from.atmosphere.depthOfField, to.atmosphere.depthOfField, progress) * (reduced ? 0 : 1),
      aberration: lerp(from.atmosphere.aberration, to.atmosphere.aberration, progress) * (reduced ? 0 : 1),
    };
  }, [from, to, progress, reduced]);

  return (
    <EffectComposer multisampling={reduced ? 0 : 4} enableNormalPass>
      <Bloom intensity={mood.bloom} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
      <SSAO radius={0.08} intensity={0.7} luminanceInfluence={0.6} bias={0.03} samples={16} />
      <DepthOfField focusDistance={0.02} focalLength={0.02} bokehScale={mood.dof * 3} />
      <Vignette eskil={false} offset={0.25} darkness={mood.vignette * 0.65} />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[mood.aberration * 0.002, mood.aberration * 0.002]}
      />
    </EffectComposer>
  );
}
