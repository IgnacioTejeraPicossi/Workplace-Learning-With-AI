import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function HologramPortal3D({ onClick, embed = false }) {
  const { t } = useTranslation();
  const [modelScale, setModelScale] = useState(0.8);
  const [modelOffsetY, setModelOffsetY] = useState(-0.5);
  const [modelSource, setModelSource] = useState('local'); // 'local' | 'remote' | 'custom'
  const [customUrl, setCustomUrl] = useState('');

  // Load saved settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hologram3d.settings');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.modelScale === 'number') setModelScale(saved.modelScale);
      if (typeof saved.modelOffsetY === 'number') setModelOffsetY(saved.modelOffsetY);
      if (typeof saved.modelSource === 'string') setModelSource(saved.modelSource);
      if (typeof saved.customUrl === 'string') setCustomUrl(saved.customUrl);
    } catch (_) {}
  }, []);

  // Persist settings
  useEffect(() => {
    const data = { modelScale, modelOffsetY, modelSource, customUrl };
    try { localStorage.setItem('hologram3d.settings', JSON.stringify(data)); } catch (_) {}
  }, [modelScale, modelOffsetY, modelSource, customUrl]);
  const webglOk = canCreateWebGLContext();
  const containerStyle = embed
    ? { width: '100%', height: '100%', margin: 0, borderRadius: 0, overflow: 'hidden', position: 'relative' }
    : { width: 'min(680px, 92vw)', height: 320, margin: '0 auto 12px', borderRadius: 20, overflow: 'hidden', position: 'relative' };

  const controlsStyle = {
    position: 'absolute',
    right: 8,
    bottom: 8,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    background: 'rgba(20,30,50,0.65)',
    border: '1px solid rgba(120,200,255,0.35)',
    borderRadius: 10,
    padding: '8px 10px',
    zIndex: 5,
    pointerEvents: 'auto'
  };
  const localUrl = '/models/RobotExpressive.glb';
  const remoteUrl = 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
  const isValidModelUrl = (url) => /\.(glb|gltf)(\?.*)?$/i.test(url || '');
  const activeUrl = useMemo(() => {
    if (modelSource === 'custom' && isValidModelUrl(customUrl)) return customUrl.trim();
    return modelSource === 'remote' ? remoteUrl : localUrl;
  }, [modelSource, customUrl]);

  useEffect(() => {
    try { if (activeUrl) useGLTF.preload(activeUrl); } catch (_) {}
  }, [activeUrl]);

  if (!webglOk) return null; // graceful fallback to CSS hologram

  return (
    <div style={containerStyle} onClick={embed ? undefined : onClick}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 7.5], fov: 50 }}
        gl={{ powerPreference: 'high-performance', antialias: true, alpha: true, preserveDrawingBuffer: false }}
        style={{ pointerEvents: embed ? 'none' : 'auto' }}
      >
        <Suspense fallback={null}>
          <Scene modelScale={modelScale} modelOffsetY={modelOffsetY} modelUrl={activeUrl} />
        </Suspense>
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
        </EffectComposer>
      </Canvas>
      {/* Controls overlay (works even when embed true) */}
      <div style={controlsStyle} onClick={(e) => e.stopPropagation()}>
        <label style={{ color: '#bfe8ff', fontSize: 12 }}>{t('askAI.controls.scale', { defaultValue: 'Scale' })}
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.01"
            value={modelScale}
            onChange={(e) => setModelScale(parseFloat(e.target.value))}
            style={{ marginLeft: 6 }}
          />
        </label>
        <label style={{ color: '#bfe8ff', fontSize: 12 }}>{t('askAI.controls.height', { defaultValue: 'Height' })}
          <input
            type="range"
            min="-0.8"
            max="0.2"
            step="0.01"
            value={modelOffsetY}
            onChange={(e) => setModelOffsetY(parseFloat(e.target.value))}
            style={{ marginLeft: 6 }}
          />
        </label>
        <label style={{ color: '#bfe8ff', fontSize: 12 }}>{t('askAI.controls.source', { defaultValue: 'Source' })}
          <select
            value={modelSource}
            onChange={(e) => setModelSource(e.target.value)}
            style={{ marginLeft: 6, background: 'rgba(255,255,255,0.12)', color: '#dff5ff', border: '1px solid rgba(120,200,255,0.4)', borderRadius: 6 }}
          >
            <option value="local">{t('askAI.controls.sourceLocal', { defaultValue: 'Local' })}</option>
            <option value="remote">{t('askAI.controls.sourceRemote', { defaultValue: 'Remote' })}</option>
            <option value="custom">{t('askAI.controls.sourceCustom', { defaultValue: 'Custom' })}</option>
          </select>
        </label>
        {modelSource === 'custom' && (
          <>
            <input
              type="text"
              placeholder={t('askAI.controls.customUrlPlaceholder', { defaultValue: 'https://.../model.glb' })}
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              style={{
                width: 220,
                background: 'rgba(255,255,255,0.12)',
                color: '#dff5ff',
                border: '1px solid rgba(120,200,255,0.4)',
                borderRadius: 6,
                padding: '4px 6px'
              }}
            />
            <button
              onClick={() => isValidModelUrl(customUrl) ? setModelSource('custom') : alert('Provide a valid .glb or .gltf URL')}
              style={{
                background: 'rgba(120,200,255,0.25)',
                border: '1px solid rgba(120,200,255,0.4)',
                color: '#dff5ff',
                borderRadius: 8,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12
              }}
              title={isValidModelUrl(customUrl) ? 'Load custom model' : 'Enter a valid .glb/.gltf URL'}
            >Use</button>
          </>
        )}
      </div>
    </div>
  );
}

function Scene({ modelScale, modelOffsetY, modelUrl }) {
  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight intensity={1.2} position={[3, 3, 5]} color="#89d8ff" />
      <Environment preset="city" />

      <PulsingRing />

      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.6}>
        <group position={[0, modelOffsetY, 0.2]}>
          <Robot scale={modelScale} url={modelUrl} />
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

function Robot({ url, ...props }) {
  // Replace with '/models/robot.glb' (public/) for offline
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

useGLTF.preload('/models/RobotExpressive.glb');
useGLTF.preload('https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb');


