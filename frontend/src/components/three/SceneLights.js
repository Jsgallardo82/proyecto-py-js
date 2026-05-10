'use client';

/**
 * SceneLights — Iluminación científica para la escena 3D.
 *
 * Ambient + directional + punto de luz cian (massless accent).
 */

export default function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        color="#E8E9F3"
      />
      <pointLight
        position={[0, 2, 0]}
        intensity={1.5}
        color="#06B6D4"
        distance={10}
      />
      <pointLight
        position={[-3, 1, -3]}
        intensity={0.5}
        color="#4F46E5"
        distance={8}
      />
    </>
  );
}
