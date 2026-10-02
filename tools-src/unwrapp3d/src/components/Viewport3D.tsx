import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { BrushSettings, Layer } from '../types';
import { autoUnwrap, normalizeObject } from '../lib/uvMapper';

interface Viewport3DProps {
  objUrl: string | null;
  texture: THREE.CanvasTexture | null;
  brush: BrushSettings;
  activeTool: 'brush' | 'eraser';
  activeLayer: Layer | undefined;
  onPaint: () => void;
}

export default function Viewport3D({ objUrl, texture, brush, activeTool, activeLayer, onPaint }: Viewport3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isPainting = useRef(false);

  // 1. Initialize Scene (Once)
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x443333, 0x111122, 0.5);
    scene.add(hemisphereLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(2, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, 2);
    scene.add(fillLight);

    // Orientation Guides
    const grid = new THREE.GridHelper(10, 20, 0x333333, 0x222222);
    grid.position.y = -1;
    scene.add(grid);

    const axes = new THREE.AxesHelper(1);
    const axisMaterials = Array.isArray(axes.material) ? axes.material : [axes.material];
    axisMaterials.forEach(material => {
      material.transparent = true;
      material.opacity = 0.5;
    });
    scene.add(axes);

    const group = new THREE.Group();
    modelGroupRef.current = group;
    scene.add(group);

    const animate = () => {
      const id = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      return id;
    };
    const animId = animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. Load Model when objUrl changes
  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group || !sceneRef.current) return;

    // Clear previous model
    while(group.children.length > 0){
      const child = group.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
      group.remove(child);
    }

    if (objUrl) {
      console.log("Loading OBJ from URL:", objUrl);
      const loader = new OBJLoader();
      loader.load(objUrl, (object) => {
        normalizeObject(object);
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            autoUnwrap(child.geometry);
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.6,
              metalness: 0.1,
              side: THREE.DoubleSide,
              color: 0xffffff
            });
          }
        });
        group.add(object);
        console.log("OBJ Loaded Successfully:", object);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (err) => {
        console.error("Error loading OBJ:", err);
      });
    } else {
      const geometry = new THREE.SphereGeometry(0.7, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
        color: 0xffffff
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    }
  }, [objUrl, texture]); // Re-run when objUrl or baseline texture changes

  // Update texture on all materials in the group
  useEffect(() => {
    if (modelGroupRef.current && texture) {
      modelGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshStandardMaterial).map = texture;
          (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });
    }
  }, [texture]);

  const paintAt = (uv: THREE.Vector2) => {
    if (!activeLayer) return;

    const ctx = activeLayer.context;
    const canvas = activeLayer.canvas;

    const x = uv.x * canvas.width;
    const y = uv.y * canvas.height;

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = brush.opacity;
    } else {
      ctx.globalAlpha = brush.opacity;
      ctx.fillStyle = brush.color;
    }

    if (brush.type === 'round') {
      ctx.beginPath();
      ctx.arc(x, y, brush.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (brush.type === 'square') {
      ctx.fillRect(x - brush.size / 2, y - brush.size / 2, brush.size, brush.size);
    } else if (brush.type === 'smooth') {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, brush.size / 2);
      if (activeTool === 'eraser') {
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        gradient.addColorStop(0, brush.color);
        gradient.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(x - brush.size / 2, y - brush.size / 2, brush.size, brush.size);
    }
    ctx.restore();

    onPaint();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPainting.current = true;
    handleInteraction(e);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isPainting.current) {
      handleInteraction(e);
    }
  };

  const onMouseUp = () => {
    isPainting.current = false;
  };

  const handleInteraction = (e: React.MouseEvent) => {
    if (!rendererRef.current || !modelGroupRef.current || !cameraRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // Intersect the entire hierarchy
    const intersects = raycaster.current.intersectObjects(modelGroupRef.current.children, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      if (intersection.uv) {
        paintAt(intersection.uv);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-crosshair bg-[radial-gradient(circle_at_50%_50%,#2a2a2a_0%,#121212_100%)] relative"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-panel-bg/80 backdrop-blur-sm border-t border-border flex items-center px-3 gap-4 text-[9px] text-gray-500 pointer-events-none">
        <span>Camera: Perspective</span>
        <span>Light: Studio_Neutral</span>
        <span className="truncate flex-1">Model: {objUrl?.split('/').pop() || 'None'}</span>
      </div>
    </div>
  );
}
