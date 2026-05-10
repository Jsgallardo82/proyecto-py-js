'use client';

/**
 * Trajectory3D — Trayectoria ZB como línea 3D.
 *
 * Dibuja la curva S1(t) como un path en el espacio 3D.
 * Usa TubeGeometry con dispose() para evitar memory leaks GPU.
 */

import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Trajectory3D({ simData }) {
  const meshRef = useRef();

  if (!simData) return null;

  const { S1, t } = simData;

  const points = useMemo(() => {
    if (!S1 || S1.length === 0) return [];
    return S1.map((s1, i) => {
      const x = s1 / 5;
      const y = 0;
      const z = (i / S1.length) * 4 - 2;
      return new THREE.Vector3(x, y, z);
    });
  }, [S1]);

  const tubeGeometry = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 200, 0.02, 8, false);
  }, [points]);

  useEffect(() => {
    return () => {
      if (tubeGeometry) {
        tubeGeometry.dispose();
      }
    };
  }, [tubeGeometry]);

  if (!tubeGeometry) return null;

  return (
    <mesh ref={meshRef} geometry={tubeGeometry}>
      <meshStandardMaterial
        color="#EF4444"
        emissive="#EF4444"
        emissiveIntensity={0.3}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}