// TagConstellation.tsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import tags from '../data/tags.json';

const TagConstellation = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 400, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, 400);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;

    const tagMaterial = new THREE.MeshBasicMaterial({ color: 0xa900ff });

    tags.forEach((tag, i) => {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const mesh = new THREE.Mesh(geometry, tagMaterial);
      const angle = (i / tags.length) * Math.PI * 2;
      const radius = 8;
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 1.3) * radius);
      scene.add(mesh);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
      renderer.render(scene, camera);
    };

    animate();

    return () => mountRef.current.removeChild(renderer.domElement);
  }, []);

  return (
    <section className="py-12 px-6 bg-[#16191f] text-center text-white">
      <h2 className="text-3xl font-bold mb-4">🌌 Emotional Tag Constellation</h2>
      <div ref={mountRef} className="mx-auto max-w-6xl rounded-xl overflow-hidden shadow-lg"></div>
    </section>
  );
};

export default TagConstellation;