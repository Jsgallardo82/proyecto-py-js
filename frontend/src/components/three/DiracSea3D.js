'use client';

import { useRef } from 'react';
import * as THREE from 'three';

export default function DiracSea3D({ diracData }) {
  const hasPair = diracData?.pair_created ?? false;
  const mc2 = diracData?.mc2 ?? 1250;

  // Scale mc² to 3D display units (z_scale = 0.001)
  const mc2_3d = Math.max(0.05, mc2 * 0.001);
  const halfGap = mc2_3d;

  return (
    <group position={[0, -3, 0]}>
      {/* Positive energy zone — at E = +mc² */}
      <mesh position={[0, halfGap, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#4F46E5"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Forbidden zone — centered at E = 0, height = 2·mc² */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#F97316"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Negative energy zone — at E = -mc² */}
      <mesh position={[0, -halfGap, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#EC4899"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pair creation indicator — only when physically created */}
      {hasPair && (
        <mesh position={[2, halfGap * 0.3, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#FBBF24"
            emissive="#FBBF24"
            emissiveIntensity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}
