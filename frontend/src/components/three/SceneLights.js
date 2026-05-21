'use client';

export default function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color="#FFFFFF" />
    </>
  );
}
