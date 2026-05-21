'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Electron3D({ simData, playhead = 0 }) {
  const meshRef = useRef();
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 0));

  const S1 = simData?.S1;
  const n = S1?.length ?? 0;
  const currentIndex = n > 0 ? Math.max(0, Math.min(playhead, n - 1)) : 0;

  const x = (S1 && S1[currentIndex] != null) ? S1[currentIndex] : 0;
  const normalizedX = x;
  const normalizedZ = n > 1 ? (currentIndex / (n - 1)) * 4 - 2 : -2;

  useEffect(() => {
    targetPosRef.current.set(normalizedX, 0, normalizedZ);
  }, [normalizedX, normalizedZ]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(normalizedX, 0, normalizedZ);
    }
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPosRef.current, 0.1);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial color="#06B6D4" roughness={0.6} metalness={0.1} />
    </mesh>
  );
}
