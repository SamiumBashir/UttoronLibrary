"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Book } from "@/lib/types";
import {
  getBookBackTexture,
  getBookCoverTexture,
  getBookSpineTexture,
  getPageEdgeTexture,
  getWalnutWoodTexture,
} from "@/lib/book-texture";
import { useEnvironmentCapabilities } from "@/components/three/WebGLGuard";

interface ScrollReadingRoomCanvasProps {
  book: Book;
  progress: number; // 0..1 scroll progress
}

export default function ScrollReadingRoomCanvas({
  book,
  progress,
}: ScrollReadingRoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const caps = useEnvironmentCapabilities();
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (!caps.ready || !caps.webglSupported || caps.reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 40);
    camera.position.set(0, 0.45, 5.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !caps.isMobile,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xf6ecd8, 0x0d2018, 0.85);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffe4b8, 2.2);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xc6a25a, 4.2, 10);
    rim.position.set(-2.5, 1.2, 2.5);
    scene.add(rim);

    // Timber Shelf in background that books glide into
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, -1.38, -0.8);
    scene.add(shelfGroup);

    const woodMat = new THREE.MeshStandardMaterial({
      map: getWalnutWoodTexture(),
      roughness: 0.65,
    });
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 0.9), woodMat);
    shelfGroup.add(plank);

    const companionBooks: THREE.Mesh[] = [];
    const companionColors = [0x143328, 0x431d1a, 0x1b2b34, 0x54402e];
    companionColors.forEach((col, idx) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1.05 + (idx % 2) * 0.14, 0.65),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 })
      );
      m.position.set(-1.5 + idx * 0.26, 0.58 + (idx % 2) * 0.07, 0);
      shelfGroup.add(m);
      companionBooks.push(m);
    });

    // Hinged Opening Book Rig
    const bookRig = new THREE.Group();
    scene.add(bookRig);

    const bw = 1.45;
    const bh = 2.08;
    const bt = 0.035;

    const coverMat = new THREE.MeshStandardMaterial({
      map: getBookCoverTexture(book),
      roughness: 0.45,
      metalness: 0.14,
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: getBookBackTexture(book),
      roughness: 0.5,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      map: getBookSpineTexture(book),
      roughness: 0.45,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: book.spineColor || book.coverPalette.primary,
      roughness: 0.55,
    });
    const pageFaceMat = new THREE.MeshStandardMaterial({
      color: 0xf7f0e2,
      roughness: 0.9,
    });
    const pageSideMat = new THREE.MeshStandardMaterial({
      map: getPageEdgeTexture(),
      roughness: 0.85,
    });

    // Back board & spine stay anchored on rig
    const backBoard = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bt), [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      pageFaceMat,
      backMat,
    ]);
    backBoard.position.set(bw / 2, 0, -0.14);
    bookRig.add(backBoard);

    const spineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, bh, bt), [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      spineMat,
    ]);
    spineMesh.rotation.y = Math.PI / 2;
    spineMesh.position.set(0, 0, 0);
    bookRig.add(spineMesh);

    // Right page block
    const rightPages = new THREE.Mesh(
      new THREE.BoxGeometry(bw - 0.08, bh - 0.1, 0.11),
      [pageSideMat, pageSideMat, pageSideMat, pageSideMat, pageFaceMat, pageSideMat]
    );
    rightPages.position.set(bw / 2 + 0.01, 0, -0.07);
    bookRig.add(rightPages);

    // Front cover hinge group (pivots around spine x=0)
    const frontHinge = new THREE.Group();
    frontHinge.position.set(0, 0, 0.12);
    bookRig.add(frontHinge);

    const frontBoard = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bt), [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      coverMat,
      pageFaceMat,
    ]);
    frontBoard.position.set(bw / 2, 0, 0);
    frontHinge.add(frontBoard);

    // Turning inner page leaf
    const turningLeaf = new THREE.Group();
    turningLeaf.position.set(0.02, 0, 0.0);
    bookRig.add(turningLeaf);

    const leafMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(bw - 0.1, bh - 0.12, 10, 1),
      new THREE.MeshStandardMaterial({
        color: 0xfaf4e6,
        roughness: 0.88,
        side: THREE.DoubleSide,
      })
    );
    leafMesh.position.set((bw - 0.1) / 2, 0, 0);
    turningLeaf.add(leafMesh);

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 600;
      const nh = container.clientHeight || 500;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    let smoothProgress = progressRef.current;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      smoothProgress += (progressRef.current - smoothProgress) * 0.08;
      const p = Math.min(1, Math.max(0, smoothProgress));

      // Rotate and glide book forward as user scrolls
      bookRig.position.x = -0.68 + Math.sin(p * Math.PI) * 0.18;
      bookRig.position.y = 0.25 - p * 0.12;
      bookRig.rotation.y = -0.55 + p * 0.65;
      bookRig.rotation.x = 0.16 - p * 0.24;

      // Open front cover smoothly between p=0.15 and p=0.65
      const openFactor = Math.min(1, Math.max(0, (p - 0.12) / 0.5));
      frontHinge.rotation.y = -openFactor * Math.PI * 0.82;

      // Turn inner page smoothly between p=0.45 and p=0.95
      const pageFactor = Math.min(1, Math.max(0, (p - 0.4) / 0.5));
      turningLeaf.rotation.y = -pageFactor * Math.PI * 0.76;

      // Slide companion books smoothly onto the shelf
      companionBooks.forEach((cb, idx) => {
        const slideIn = Math.min(1, Math.max(0, p * 1.4 - idx * 0.12));
        cb.position.z = -1.1 + slideIn * 1.1;
      });

      camera.position.x = -0.4 + p * 0.65;
      camera.lookAt(0, 0.05, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [book, caps.ready, caps.webglSupported, caps.reducedMotion, caps.isMobile]);

  if (caps.ready && (!caps.webglSupported || caps.reducedMotion)) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-[#c6a25a]/25 bg-[#0d221a] p-8">
        <div
          className="flex h-64 w-44 flex-col justify-between rounded-r-md border border-[#c6a25a]/40 p-4 shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${book.coverPalette.primary}, ${book.coverPalette.secondary})`,
          }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#d6b87a]">
            {book.category}
          </span>
          <p className="font-serif text-lg font-semibold text-[#f6f1e7]">{book.title}</p>
          <span className="text-xs text-[#f6f1e7]/75">{book.authorName}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Scroll-driven 3D book opening animation"
    />
  );
}

