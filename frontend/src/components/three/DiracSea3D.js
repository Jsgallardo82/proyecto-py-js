'use client';

/**
 * DiracSea3D — Mar de Dirac como 3 planos horizontales.
 *
 * Zona positiva (índigo), zona prohibida (naranja), zona negativa (magenta).
 * Semáforo visual del espectro energético.
 */

import * as THREE from 'three';

export default function DiracSea3D({ diracData }) {
  const hasPair = diracData?.pair_created ?? false;

  return (
    <group position={[0, -3, 0]}>
      {/* Zona de energía positiva (E >= mc²) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#4F46E5"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zona prohibida (banda 2mc²) */}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#F97316"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zona de energía negativa (E <= -mc²) */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#EC4899"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Línea divisoria */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.01, 8, 0.01]} />
        <meshBasicMaterial color="#6B7280" transparent opacity={0.3} />
      </mesh>

      {/* Indicador de creación de par */}
      {hasPair && (
        <mesh position={[2, 0.5, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color="#FBBF24"
            emissive="#FBBF24"
            emissiveIntensity={1}
          />
        </mesh>
      )}
    </group>
  );
}
