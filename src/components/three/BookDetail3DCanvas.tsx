"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Book } from "@/lib/types";
import {
  getBookBackTexture,
  getBookCoverTexture,
  getBookSpineTexture,
  getPageEdgeTexture,
} from "@/lib/book-texture";
import { useEnvironmentCapabilities } from "@/components/three/WebGLGuard";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

type ViewPreset = "3d" | "front" | "spine" | "back";

interface BookDetail3DCanvasProps {
  book: Book;
}

const PRESET_ROTATIONS: Record<ViewPreset, { x: number; y: number }> = {
  "3d": { x: 0.14, y: -0.45 },
  front: { x: 0, y: 0 },
  spine: { x: 0, y: Math.PI / 2 },
  back: { x: 0, y: Math.PI },
};

export default function BookDetail3DCanvas({ book }: BookDetail3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const caps = useEnvironmentCapabilities();
  const [preset, setPreset] = useState<ViewPreset>("3d");
  const [zoom, setZoom] = useState(4.6);

  const targetRotRef = useRef({ ...PRESET_ROTATIONS["3d"] });
  const zoomRef = useRef(4.6);
  zoomRef.current = zoom;

  const selectPreset = (next: ViewPreset) => {
    setPreset(next);
    targetRotRef.current = { ...PRESET_ROTATIONS[next] };
  };

  useEffect(() => {
    if (!caps.ready || !caps.webglSupported) return;
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 540;
    const h = container.clientHeight || 540;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 30);
    camera.position.set(0, 0.1, zoomRef.current);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xe8e4da, 1.35);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfffaf0, 1.8);
    key.position.set(3.5, 4.5, 5);
    scene.add(key);
    const fill = new THREE.PointLight(0xffffff, 2.2, 12);
    fill.position.set(-3, -1.5, 3);
    scene.add(fill);

    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const bw = 1.65;
    const bh = 2.42;
    const bd = 0.34;
    const bt = 0.036;

    const coverMat = new THREE.MeshStandardMaterial({
      map: getBookCoverTexture(book),
      roughness: 0.42,
      metalness: 0.15,
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: getBookBackTexture(book),
      roughness: 0.48,
      metalness: 0.1,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      map: getBookSpineTexture(book),
      roughness: 0.42,
      metalness: 0.18,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: book.spineColor || book.coverPalette.primary,
      roughness: 0.55,
    });
    const pagesMat = new THREE.MeshStandardMaterial({
      map: getPageEdgeTexture(),
      roughness: 0.85,
    });

    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(bw - 0.06, bh - 0.1, bd - bt * 2.1),
      pagesMat
    );
    pages.position.x = 0.025;
    bookGroup.add(pages);

    const frontBoard = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bt), [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      coverMat,
      edgeMat,
    ]);
    frontBoard.position.z = bd / 2 - bt / 2;
    bookGroup.add(frontBoard);

    const backBoard = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bt), [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      backMat,
    ]);
    backBoard.position.z = -bd / 2 + bt / 2;
    bookGroup.add(backBoard);

    const spineMesh = new THREE.Mesh(new THREE.BoxGeometry(bt * 1.18, bh, bd), [
      edgeMat,
      spineMat,
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
    ]);
    spineMesh.position.x = -bw / 2 + bt * 0.42;
    bookGroup.add(spineMesh);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotRef.current.y += dx * 0.01;
      targetRotRef.current.x = Math.max(
        -0.8,
        Math.min(0.8, targetRotRef.current.x + dy * 0.008)
      );
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(3.2, Math.min(6.4, z + e.deltaY * 0.0025)));
    };
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 540;
      const nh = container.clientHeight || 540;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      bookGroup.rotation.y += (targetRotRef.current.y - bookGroup.rotation.y) * 0.1;
      bookGroup.rotation.x += (targetRotRef.current.x - bookGroup.rotation.x) * 0.1;
      if (!caps.reducedMotion && !dragging && preset === "3d") {
        bookGroup.position.y = Math.sin(t * 1.4) * 0.04;
      } else {
        bookGroup.position.y += (0 - bookGroup.position.y) * 0.1;
      }
      camera.position.z += (zoomRef.current - camera.position.z) * 0.12;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [book, caps.ready, caps.webglSupported, caps.reducedMotion, preset]);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-gradient-to-br from-[#ffffff] via-[#f6f5f0] to-[#eceae3] shadow-lg">
      <div className="relative h-[300px] xs:h-[360px] sm:h-[460px] md:h-[520px] w-full">
        {caps.ready && !caps.webglSupported ? (
          <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
            <div
              className="flex h-60 w-40 sm:h-80 sm:w-56 flex-col justify-between rounded-r-lg border border-[#dedbd2] p-4 sm:p-6 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${book.coverPalette.primary}, ${book.coverPalette.secondary})`,
              }}
            >
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#d6b87a]">
                {book.category}
              </span>
              <h3 className="font-serif text-lg sm:text-2xl font-bold text-[#f6f1e7]">{book.title}</h3>
              <span className="text-[11px] sm:text-xs text-[#f6f1e7]/80">{book.authorName}</span>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full cursor-grab active:cursor-grabbing"
            aria-label={`Interactive 3D model of ${book.title}`}
          />
        )}

        {/* Zoom & Reset Controls */}
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex flex-col gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.max(3.2, z - 0.45))}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] backdrop-blur-md transition hover:border-[#141413]"
          >
            <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.min(6.4, z + 0.45))}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] backdrop-blur-md transition hover:border-[#141413]"
          >
            <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            aria-label="Reset 3D view"
            onClick={() => {
              setZoom(4.6);
              selectPreset("3d");
            }}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] backdrop-blur-md transition hover:border-[#141413]"
          >
            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <p className="pointer-events-none absolute left-3 top-3 sm:left-5 sm:top-4 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#62605a]">
          Drag to rotate 360° • Scroll to zoom
        </p>
      </div>

      {/* Angle Preset Strip (Front, Spine, Back, 3D) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dedbd2] bg-white/90 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(
            [
              { id: "3d", label: "3D Orbit" },
              { id: "front", label: "Front Cover" },
              { id: "spine", label: "Spine" },
              { id: "back", label: "Back Cover" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectPreset(item.id)}
              className={`rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-mono text-[10px] sm:text-[11px] font-medium transition ${
                preset === item.id
                  ? "bg-[#141413] text-white"
                  : "border border-[#dedbd2] bg-[#f6f5f0] text-[#141413] hover:border-[#141413]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="hidden xs:inline font-mono text-[10px] sm:text-[11px] text-[#62605a]">{book.binding}</span>
      </div>
    </div>
  );
}

