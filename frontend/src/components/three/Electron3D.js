'use client';

/**
 * Electron3D — Representacion 3D del electron con glow.
 *
 * Esfera central + halo semitransparente que pulsa levemente.
 * Usa stateRef pattern para evitar recrear draw en cada dispatch.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Electron3D({ simData, playhead = 0 }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const targetXRef = useRef(0);

  const S1 = simData?.S1;
  const currentIndex = (S1 && S1.length > 0) ? Math.max(0, Math.min(playhead, S1.length - 1)) : 0;
  const x = (S1 && S1[currentIndex] != null) ? S1[currentIndex] : 0;
  const normalizedX = x / 5;

  useEffect(() => {
    targetXRef.current = normalizedX;
  }, [normalizedX]);

  const pulseFreq = useMemo(() => {
    const mass = simData?.masa_simulada ?? 1e-35;
    return Math.max(1, Math.min(8, Math.log10(Math.max(mass, 1e-35)) + 35));
  }, [simData?.masa_simulada]);

  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + 0.15 * Math.sin(pulseFreq * t);
      glowRef.current.scale.setScalar(scale);
    }
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        targetXRef.current,
        0.1
      );
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#06B6D4"
          emissive="#06B6D4"
          emissiveIntensity={0.8}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial
          color="#06B6D4"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#E8E9F3" />
      </mesh>
    </group>
  );
}