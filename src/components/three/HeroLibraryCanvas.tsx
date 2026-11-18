"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import type { Book } from "@/lib/types";
import {
  getBookBackTexture,
  getBookCoverTexture,
  getBookSpineTexture,
  getPageEdgeTexture,
  getWalnutWoodTexture,
} from "@/lib/book-texture";
import { useEnvironmentCapabilities } from "@/components/three/WebGLGuard";
import { formatPrice } from "@/lib/format";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface HeroLibraryCanvasProps {
  books: Book[];
  activeBook: Book;
  onSelectBook: (book: Book) => void;
}

function createRealisticBookMesh(book: Book, scale = 1): THREE.Group {
  const group = new THREE.Group();

  const width = 1.48 * scale;
  const height = 2.18 * scale;
  const depth = 0.28 * scale;
  const boardThickness = 0.032 * scale;
  const pageInset = 0.055 * scale;

  const coverTex = getBookCoverTexture(book);
  const backTex = getBookBackTexture(book);
  const spineTex = getBookSpineTexture(book);
  const pageTex = getPageEdgeTexture();

  const coverMat = new THREE.MeshStandardMaterial({
    map: coverTex,
    roughness: 0.48,
    metalness: 0.14,
  });
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    roughness: 0.52,
    metalness: 0.1,
  });
  const spineMat = new THREE.MeshStandardMaterial({
    map: spineTex,
    roughness: 0.45,
    metalness: 0.18,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: book.spineColor || book.coverPalette.primary,
    roughness: 0.55,
    metalness: 0.08,
  });
  const pagesMat = new THREE.MeshStandardMaterial({
    map: pageTex,
    roughness: 0.85,
    metalness: 0.02,
  });

  // Page block (recessed inside hardcover boards)
  const pageGeo = new THREE.BoxGeometry(
    width - pageInset,
    height - pageInset * 1.6,
    depth - boardThickness * 2.1
  );
  const pageBlock = new THREE.Mesh(pageGeo, pagesMat);
  pageBlock.position.x = pageInset * 0.35;
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  // Front cover board
  const frontBoardGeo = new THREE.BoxGeometry(width, height, boardThickness);
  const frontBoard = new THREE.Mesh(frontBoardGeo, [
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
    coverMat,
    edgeMat,
  ]);
  frontBoard.position.z = depth / 2 - boardThickness / 2;
  frontBoard.castShadow = true;
  frontBoard.receiveShadow = true;
  group.add(frontBoard);

  // Back cover board
  const backBoard = new THREE.Mesh(frontBoardGeo, [
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
    backMat,
  ]);
  backBoard.position.z = -depth / 2 + boardThickness / 2;
  backBoard.castShadow = true;
  backBoard.receiveShadow = true;
  group.add(backBoard);

  // Spine
  const spineGeo = new THREE.BoxGeometry(boardThickness * 1.15, height, depth);
  const spineMesh = new THREE.Mesh(spineGeo, [
    edgeMat,
    spineMat,
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
  ]);
  spineMesh.position.x = -width / 2 + boardThickness * 0.45;
  spineMesh.castShadow = true;
  spineMesh.receiveShadow = true;
  group.add(spineMesh);

  // Subtle gold bookmark ribbon
  const ribbonGeo = new THREE.BoxGeometry(0.06 * scale, 0.36 * scale, 0.012 * scale);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xc6a25a,
    roughness: 0.35,
    metalness: 0.45,
  });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.set(0.18 * scale, -height / 2 - 0.11 * scale, 0.01 * scale);
  ribbon.rotation.z = 0.08;
  group.add(ribbon);

  return group;
}

export default function HeroLibraryCanvas({
  books,
  activeBook,
  onSelectBook,
}: HeroLibraryCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const caps = useEnvironmentCapabilities();
  const [hoveredBook, setHoveredBook] = useState<{
    book: Book;
    x: number;
    y: number;
  } | null>(null);
  const activeBookRef = useRef(activeBook);
  activeBookRef.current = activeBook;
  const onSelectRef = useRef(onSelectBook);
  onSelectRef.current = onSelectBook;
  const centralHolderRef = useRef<THREE.Group | null>(null);

  // Swap central 3D book cleanly when activeBook changes
  useEffect(() => {
    const holder = centralHolderRef.current;
    if (!holder) return;
    while (holder.children.length > 0) {
      const child = holder.children[0];
      holder.remove(child);
    }
    const nextMesh = createRealisticBookMesh(activeBook, 1.02);
    holder.add(nextMesh);
  }, [activeBook]);

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

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x091913, 0.058);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(0, 0.35, caps.isMobile ? 7.6 : 6.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !caps.isMobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, caps.isMobile ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !caps.isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Cinematic 3-point Library Lighting
    const hemiLight = new THREE.HemisphereLight(0xf6ecd8, 0x091811, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.SpotLight(0xffe1ae, 34, 24, Math.PI / 4, 0.55, 1.4);
    keyLight.position.set(3.8, 5.2, 5.4);
    keyLight.castShadow = !caps.isMobile;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xc6a25a, 7.5, 14);
    rimLight.position.set(-3.4, 2.2, 2.4);
    scene.add(rimLight);

    const emeraldFill = new THREE.PointLight(0x2d6b52, 4.5, 12);
    emeraldFill.position.set(2.8, -1.8, 2.5);
    scene.add(emeraldFill);

    // Architectural Walnut Bookshelf Backdrop
    const libraryGroup = new THREE.Group();
    libraryGroup.position.set(caps.isMobile ? 0 : 1.05, -0.1, -1.55);
    scene.add(libraryGroup);

    const walnutTex = getWalnutWoodTexture();
    walnutTex.repeat.set(2, 2);
    const woodMat = new THREE.MeshStandardMaterial({
      map: walnutTex,
      roughness: 0.62,
      metalness: 0.08,
    });
    const backPanelMat = new THREE.MeshStandardMaterial({
      color: 0x0b1f17,
      roughness: 0.9,
      metalness: 0.04,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc6a25a,
      roughness: 0.3,
      metalness: 0.78,
    });

    // Back wall of bookcase
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(7.6, 5.4, 0.14), backPanelMat);
    backPanel.position.set(0, 0, -0.45);
    backPanel.receiveShadow = true;
    libraryGroup.add(backPanel);

    // Side stiles & center divider
    [-3.7, 0, 3.7].forEach((x) => {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.4, 0.95), woodMat);
      stile.position.set(x, 0, 0);
      stile.castShadow = true;
      stile.receiveShadow = true;
      libraryGroup.add(stile);
    });

    // Horizontal shelves + brass trim
    const shelfYs = [-2.45, -0.82, 0.82, 2.45];
    shelfYs.forEach((y) => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.14, 0.96), woodMat);
      plank.position.set(0, y, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      libraryGroup.add(plank);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(7.58, 0.025, 0.03), brassMat);
      trim.position.set(0, y + 0.055, 0.48);
      libraryGroup.add(trim);
    });

    // Bookshelf interactive books
    const shelfInteractables: Array<{ mesh: THREE.Object3D; book: Book; baseZ: number }> = [];
    const rows = [-0.82 + 0.07, 0.82 + 0.07, -2.45 + 0.07];
    const catalogPool = books.length > 0 ? books : [activeBookRef.current];

    let bookCounter = 0;
    rows.forEach((shelfTopY, rowIdx) => {
      const bays = [-3.32, 0.38];
      bays.forEach((startX, bayIdx) => {
        let cursorX = startX;
        const count = caps.isMobile ? 4 : 6;
        for (let i = 0; i < count; i++) {
          const book = catalogPool[bookCounter % catalogPool.length];
          bookCounter++;
          const bH = 1.05 + ((bookCounter * 17) % 5) * 0.06;
          const bW = 0.21 + ((bookCounter * 13) % 3) * 0.04;
          const bD = 0.68;

          const shelfBook = new THREE.Group();
          const spineTex = getBookSpineTexture(book);
          const bodyMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(book.coverPalette.primary),
            roughness: 0.55,
            metalness: 0.12,
          });
          const spineFrontMat = new THREE.MeshStandardMaterial({
            map: spineTex,
            roughness: 0.45,
            metalness: 0.18,
          });

          const mesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), [
            bodyMat,
            bodyMat,
            bodyMat,
            bodyMat,
            spineFrontMat,
            bodyMat,
          ]);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { book };
          shelfBook.add(mesh);

          // Occasional leaned book on shelf end
          const isLeaning = i === count - 1 && (rowIdx + bayIdx) % 2 === 0;
          if (isLeaning) {
            shelfBook.rotation.z = -0.16;
            cursorX += 0.12;
          }

          const baseZ = 0.08;
          shelfBook.position.set(cursorX + bW / 2, shelfTopY + bH / 2, baseZ);
          libraryGroup.add(shelfBook);
          shelfInteractables.push({ mesh: shelfBook, book, baseZ });
          cursorX += bW + 0.035;
        }
      });
    });

    // Central Floating Featured 3D Book
    const centralPivot = new THREE.Group();
    centralPivot.position.set(caps.isMobile ? 0 : 1.15, 0.15, 1.9);
    scene.add(centralPivot);

    const centralHolder = new THREE.Group();
    centralPivot.add(centralHolder);
    centralHolderRef.current = centralHolder;
    centralHolder.add(createRealisticBookMesh(activeBookRef.current, 1.02));

    // Soft floating glow ring beneath central book
    const auraGeo = new THREE.RingGeometry(0.7, 1.35, 48);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xc6a25a,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.set(centralPivot.position.x, -1.55, centralPivot.position.z);
    scene.add(aura);

    // Floating Golden Dust Particles
    const particleCount = caps.isMobile ? 55 : 130;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.2) * 5;
      speeds[i] = 0.15 + Math.random() * 0.35;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xe6c88a,
      size: caps.isMobile ? 0.035 : 0.028,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Pointer tracking & Raycaster
    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    let hoveredShelfBook: THREE.Object3D | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetPointer.set(nx, ny);

      raycaster.setFromCamera(targetPointer, camera);
      const hits = raycaster.intersectObjects(
        shelfInteractables.map((s) => s.mesh),
        true
      );
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.book) {
          obj = obj.parent;
        }
        const hitBook = obj?.userData?.book as Book | undefined;
        if (hitBook) {
          hoveredShelfBook = hits[0].object.parent;
          renderer.domElement.style.cursor = "pointer";
          setHoveredBook({
            book: hitBook,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }
      hoveredShelfBook = null;
      renderer.domElement.style.cursor = "default";
      setHoveredBook(null);
    };

    const handleClick = () => {
      raycaster.setFromCamera(targetPointer, camera);
      const hits = raycaster.intersectObjects(
        shelfInteractables.map((s) => s.mesh),
        true
      );
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.book) {
          obj = obj.parent;
        }
        const hitBook = obj?.userData?.book as Book | undefined;
        if (hitBook) {
          onSelectRef.current(hitBook);
        }
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointermove", handlePointerMove);
    dom.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const t = clock.getElapsedTime();
      pointer.lerp(targetPointer, 0.055);

      // Smooth camera parallax
      camera.position.x = pointer.x * 0.42;
      camera.position.y = 0.35 + pointer.y * 0.24;
      camera.lookAt(caps.isMobile ? 0 : 0.45, 0.1, 0.4);

      // Central book gentle float + cursor-reactive rotation
      centralPivot.position.y = 0.15 + Math.sin(t * 1.15) * 0.09;
      centralPivot.rotation.y = -0.38 + pointer.x * 0.55 + Math.sin(t * 0.5) * 0.16;
      centralPivot.rotation.x = 0.12 - pointer.y * 0.25;
      centralPivot.rotation.z = Math.sin(t * 0.7) * 0.03;

      // Animate shelf books (subtle pull-out on hover)
      for (const item of shelfInteractables) {
        const isHovered = item.mesh === hoveredShelfBook;
        const targetZ = isHovered ? item.baseZ + 0.34 : item.baseZ;
        item.mesh.position.z += (targetZ - item.mesh.position.z) * 0.14;
      }

      // Drift dust particles
      const posAttr = dustGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i) + speeds[i] * 0.004;
        if (py > 3.4) py = -3.2;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      centralHolderRef.current = null;
      dustGeo.dispose();
      dustMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      renderer.dispose();
    };
  }, [books, caps.ready, caps.webglSupported, caps.reducedMotion, caps.isMobile]);

  // Accessible Static Fallback for unsupported WebGL or reduced motion
  if (caps.ready && (!caps.webglSupported || caps.reducedMotion)) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#081812] via-[#0e241c] to-[#143328] p-8">
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div
            className="flex h-72 w-48 flex-col justify-between rounded-r-md border border-[#c6a25a]/50 p-5 shadow-[14px_20px_40px_rgba(0,0,0,0.65)]"
            style={{
              background: `linear-gradient(135deg, ${activeBook.coverPalette.primary}, ${activeBook.coverPalette.secondary})`,
            }}
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#d6b87a]">
              {activeBook.category}
            </span>
            <h3 className="font-serif text-xl font-semibold leading-tight text-[#f6f1e7]">
              {activeBook.title}
            </h3>
            <span className="text-xs text-[#f6f1e7]/80">{activeBook.authorName}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#d6b87a]/80">
            Archival Edition • {formatPrice(activeBook.price)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label="Interactive 3D Virtual Library" />

      {/* Hovered Shelf Book Interactive Tooltip */}
      {hoveredBook && (
        <div
          className="pointer-events-none absolute z-20 w-60 rounded-xl border border-[#c6a25a]/40 bg-[#0b1c15]/92 p-3 text-left shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(Math.max(hoveredBook.x + 16, 16), 420),
            top: Math.max(hoveredBook.y - 40, 16),
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#d6b87a]">
            {hoveredBook.book.category}
          </p>
          <p className="mt-0.5 font-serif text-base font-semibold leading-snug text-[#f6f1e7]">
            {hoveredBook.book.title}
          </p>
          <p className="mt-0.5 text-xs text-[#f6f1e7]/70">{hoveredBook.book.authorName}</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#d6b87a]">
              {formatPrice(hoveredBook.book.price)}
            </span>
            <span className="text-[11px] text-[#f6f1e7]/65">Click to feature</span>
          </div>
        </div>
      )}

      {/* Active 3D Book Floating Pill */}
      <div className="absolute bottom-5 right-5 z-10 hidden items-center gap-3 rounded-full border border-[#c6a25a]/35 bg-[#091812]/80 px-4 py-2 text-xs text-[#f6f1e7] backdrop-blur-md sm:flex">
        <Sparkles className="h-3.5 w-3.5 text-[#d6b87a]" />
        <span className="max-w-[180px] truncate font-medium">{activeBook.title}</span>
        <Link
          href={`/books/${activeBook.slug}`}
          className="inline-flex items-center gap-1 font-semibold text-[#d6b87a] transition hover:text-[#f6f1e7]"
        >
          Inspect 3D <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

