'use client';

import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Trajectory3D({ simData, playhead = 0 }) {
  const fullLineRef = useRef();
  const playedLineRef = useRef();

  const { S1, t } = simData ?? {};
  const n = S1?.length ?? 0;

  const fullPositions = useMemo(() => {
    if (n === 0) return [];
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = S1[i];
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (i / (n - 1)) * 4 - 2;
    }
    return positions;
  }, [S1, n]);

  const playedIndex = Math.min(playhead, n - 1);

  const playedPositions = useMemo(() => {
    if (n === 0 || playedIndex < 1) return null;
    const len = playedIndex + 1;
    const positions = new Float32Array(len * 3);
    for (let i = 0; i <= playedIndex; i++) {
      positions[i * 3] = S1[i];
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (i / (n - 1)) * 4 - 2;
    }
    return positions;
  }, [S1, n, playedIndex]);

  const fullGeom = useMemo(() => {
    if (fullPositions.length === 0) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(fullPositions, 3));
    return geom;
  }, [fullPositions]);

  const playedGeom = useMemo(() => {
    if (!playedPositions) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(playedPositions, 3));
    return geom;
  }, [playedPositions]);

  useEffect(() => {
    return () => {
      if (fullGeom) fullGeom.dispose();
      if (playedGeom) playedGeom.dispose();
    };
  }, [fullGeom, playedGeom]);

  if (!simData || n < 2) return null;

  return (
    <group>
      <line ref={fullLineRef} geometry={fullGeom}>
        <lineBasicMaterial color="#EF4444" transparent opacity={0.15} />
      </line>

      {playedGeom && (
        <line ref={playedLineRef} geometry={playedGeom}>
          <lineBasicMaterial color="#EF4444" transparent opacity={0.7} />
        </line>
      )}
    </group>
  );
}
