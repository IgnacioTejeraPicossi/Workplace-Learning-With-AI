import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

function canCreateWebGLContext() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    return !!gl;
  } catch (_) {
    return false;
  }
}

export default function HologramPortal3D({ onClick }) {
  if (!canCreateWebGLContext()) return null; // graceful fallback to CSS hologram
  return (
    <div style={{ width: 'min(680px, 92vw)', height: 260, margin: '0 auto 12px', borderRadius: 20, overflow: 'hidden', pointerEvents: 'auto' }} onClick={onClick}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ powerPreference: 'high-performance', antialias: true, alpha: true, preserveDrawingBuffer: false }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function Scene() {
  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight intensity={1.2} position={[3, 3, 5]} color="#89d8ff" />
      <Environment preset="city" />

      <PulsingRing />

      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.6}>
        <group position={[0, 0, 0.2]}>
          <Robot scale={1.2} />
        </group>
      </Float>

      <Sparkles count={70} scale={[6, 3, 1]} size={3} speed={0.35} color="#8fe8ff" opacity={0.6} />
    </group>
  );
}

function PulsingRing() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.7 + Math.sin(t * 3.0) * 0.35;
      ref.current.rotation.z = t * 0.25;
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.2, 0.25, 64, 256]} />
      <meshStandardMaterial color="#69d7ff" emissive="#69d7ff" metalness={0.4} roughness={0.1} />
    </mesh>
  );
}

function Robot(props) {
  // Replace with '/models/robot.glb' (public/) for offline
  const url = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RobotExpressive/glTF/RobotExpressive.gltf';
  const { scene } = useGLTF(url);
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = Math.sin(t * 0.5) * 0.4;
      ref.current.position.y = Math.sin(t * 0.9) * 0.15;
    }
  });
  return <primitive ref={ref} object={scene} {...props} />;
}

useGLTF.preload('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RobotExpressive/glTF/RobotExpressive.gltf');


