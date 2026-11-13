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
import { formatPrice } from "@/lib/format";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface MinimazeGalleryCanvasProps {
  books: Book[];
  progress: number; // 0..1 walkthrough scroll progress
  onInspectBook: (book: Book) => void;
}

function createGalleryBookMesh(book: Book, scale = 1): THREE.Group {
  const group = new THREE.Group();
  const w = 1.05 * scale;
  const h = 1.54 * scale;
  const d = 0.2 * scale;
  const bt = 0.025 * scale;

  const coverMat = new THREE.MeshStandardMaterial({
    map: getBookCoverTexture(book),
    roughness: 0.42,
    metalness: 0.12,
  });
  const backMat = new THREE.MeshStandardMaterial({
    map: getBookBackTexture(book),
    roughness: 0.48,
  });
  const spineMat = new THREE.MeshStandardMaterial({
    map: getBookSpineTexture(book),
    roughness: 0.42,
    metalness: 0.14,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: book.spineColor || book.coverPalette.primary,
    roughness: 0.55,
  });
  const pagesMat = new THREE.MeshStandardMaterial({
    map: getPageEdgeTexture(),
    roughness: 0.88,
  });

  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.04 * scale, h - 0.06 * scale, d - bt * 2.1),
    pagesMat
  );
  pages.position.x = 0.015 * scale;
  pages.castShadow = true;
  group.add(pages);

  const frontBoard = new THREE.Mesh(new THREE.BoxGeometry(w, h, bt), [
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
    coverMat,
    edgeMat,
  ]);
  frontBoard.position.z = d / 2 - bt / 2;
  frontBoard.castShadow = true;
  group.add(frontBoard);

  const backBoard = new THREE.Mesh(new THREE.BoxGeometry(w, h, bt), [
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
    backMat,
  ]);
  backBoard.position.z = -d / 2 + bt / 2;
  backBoard.castShadow = true;
  group.add(backBoard);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(bt * 1.15, h, d), [
    edgeMat,
    spineMat,
    edgeMat,
    edgeMat,
    edgeMat,
    edgeMat,
  ]);
  spine.position.x = -w / 2 + bt * 0.42;
  spine.castShadow = true;
  group.add(spine);

  return group;
}

function createWallPlaqueTexture(book: Book, index: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 192;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#faf9f5";
  ctx.fillRect(0, 0, 384, 192);
  ctx.strokeStyle = "#d9d6cd";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 376, 184);

  // Gallery red dot + index number
  ctx.fillStyle = "#d93829";
  ctx.beginPath();
  ctx.arc(30, 34, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#62605a";
  ctx.font = "600 16px monospace";
  ctx.fillText(`EXHIBIT ${String(index + 1).padStart(2, "0")} / ${book.category.toUpperCase()}`, 46, 40);

  ctx.fillStyle = "#141413";
  ctx.font = "700 24px Georgia, serif";
  const shortTitle = book.title.length > 26 ? `${book.title.slice(0, 24)}...` : book.title;
  ctx.fillText(shortTitle, 24, 92);

  ctx.fillStyle = "#4d4b46";
  ctx.font = "400 18px sans-serif";
  ctx.fillText(book.authorName, 24, 126);

  ctx.fillStyle = "#141413";
  ctx.font = "700 20px monospace";
  ctx.fillText(formatPrice(book.price), 24, 162);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function MinimazeGalleryCanvas({
  books,
  progress,
  onInspectBook,
}: MinimazeGalleryCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const caps = useEnvironmentCapabilities();
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const onInspectRef = useRef(onInspectBook);
  onInspectRef.current = onInspectBook;

  const [hoveredExhibit, setHoveredExhibit] = useState<{
    book: Book;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!caps.ready || !caps.webglSupported) return;
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

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 720;

    // Bright Minimaze-Light Museum White Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f4ef);
    scene.fog = new THREE.Fog(0xf5f4ef, 12, 34);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 70);

    const renderer = new THREE.WebGLRenderer({
      antialias: !caps.isMobile,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, caps.isMobile ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !caps.isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Bright Gallery Daylight + Warm Niche Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xe2dfd7, 0.85);
    scene.add(hemi);

    const sunDir = new THREE.DirectionalLight(0xfffaf0, 1.25);
    sunDir.position.set(4, 9, 6);
    sunDir.castShadow = !caps.isMobile;
    sunDir.shadow.mapSize.width = 1024;
    sunDir.shadow.mapSize.height = 1024;
    scene.add(sunDir);

    // Architectural Materials (White Plaster, Pale Stone Floor, Recessed Niche Shadow)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf7f6f1,
      roughness: 0.88,
      metalness: 0.02,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xe3e0d7,
      roughness: 0.72,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xeceae2,
      roughness: 0.42,
      metalness: 0.05,
    });
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.05,
    });
    const nicheBackMat = new THREE.MeshStandardMaterial({
      color: 0xebe8df,
      roughness: 0.9,
    });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x9b9890 });

    // Gallery Architectural Floor & Ceiling
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 56), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(5, -2.2, -14);
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(42, 56), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(5, 3.6, -14);
    scene.add(ceiling);

    // L-Shaped Corridor Architecture (Corridor 1 along -Z, turning 90° Right into Wing 2 along +X!)
    // Left wall extending along corridor 1 & closing the corner at z = -22
    const leftWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.8, 28), wallMat);
    leftWall1.position.set(-4.2, 0.7, -8.5);
    leftWall1.receiveShadow = true;
    scene.add(leftWall1);

    // Right wall for Corridor 1 (ends at z = -14.5 to open the corner turn!)
    const rightWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.8, 18), wallMat);
    rightWall1.position.set(4.2, 0.7, -5.5);
    rightWall1.receiveShadow = true;
    scene.add(rightWall1);

    // Corner Back Wall (closes end of Hall 1 at z = -22.5, guides eye to turn right)
    const cornerWall = new THREE.Mesh(new THREE.BoxGeometry(24, 5.8, 0.4), wallMat);
    cornerWall.position.set(7.5, 0.7, -22.5);
    cornerWall.receiveShadow = true;
    scene.add(cornerWall);

    // Wing 2 South Wall (runs along +X after corner)
    const wing2FrontWall = new THREE.Mesh(new THREE.BoxGeometry(18, 5.8, 0.4), wallMat);
    wing2FrontWall.position.set(13.2, 0.7, -14.5);
    wing2FrontWall.receiveShadow = true;
    scene.add(wing2FrontWall);

    // Architectural Ceiling Light Coves (glowing minimalist strips)
    const coveMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let z = 1; z >= -19; z -= 4) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.18), coveMat);
      strip.position.set(0, 3.55, z);
      scene.add(strip);
    }
    for (let x = 4; x <= 18; x += 4) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 3.4), coveMat);
      strip.position.set(x, 3.55, -18.5);
      scene.add(strip);
    }

    // Hanging Wire Installation in Entrance Foyer (Minimaze signature detail!)
    const wireSignGroup = new THREE.Group();
    wireSignGroup.position.set(0, 1.9, -2.5);
    scene.add(wireSignGroup);

    [-1.4, 1.4].forEach((wx) => {
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 2.2), wireMat);
      wire.position.set(wx, 0.9, 0);
      wireSignGroup.add(wire);
    });

    const signCanvas = document.createElement("canvas");
    signCanvas.width = 768;
    signCanvas.height = 160;
    const sCtx = signCanvas.getContext("2d")!;
    sCtx.fillStyle = "#ffffff";
    sCtx.fillRect(0, 0, 768, 160);
    sCtx.strokeStyle = "#141413";
    sCtx.lineWidth = 3;
    sCtx.strokeRect(4, 4, 760, 152);
    sCtx.fillStyle = "#d93829";
    sCtx.beginPath();
    sCtx.arc(46, 52, 9, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.fillStyle = "#62605a";
    sCtx.font = "600 18px monospace";
    sCtx.fillText("EXHIBITION HALL 01  •  UTTORON PROKASONI", 72, 58);
    sCtx.fillStyle = "#141413";
    sCtx.font = "700 38px Georgia, serif";
    sCtx.fillText("STORIES THAT SHAPE WORLDS", 40, 118);

    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.68, 0.05),
      [
        trimMat,
        trimMat,
        trimMat,
        trimMat,
        new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 }),
        trimMat,
      ]
    );
    wireSignGroup.add(signBoard);

    // Place Interactive Lit Wall Niches + Floating 3D Books along Hall 1 & Wing 2!
    const exhibitBooks = books.slice(0, 8);
    const exhibitSpecs: Array<{
      pos: [number, number, number];
      rotY: number;
    }> = [
      // Hall 1 Left & Right Walls
      { pos: [-3.75, 0.25, -4.5], rotY: Math.PI / 2 },
      { pos: [3.75, 0.25, -6.5], rotY: -Math.PI / 2 },
      { pos: [-3.75, 0.25, -10.0], rotY: Math.PI / 2 },
      { pos: [3.75, 0.25, -12.0], rotY: -Math.PI / 2 },
      { pos: [-3.75, 0.25, -15.5], rotY: Math.PI / 2 },
      // Corner Focal Niche
      { pos: [2.2, 0.25, -22.0], rotY: 0 },
      // Wing 2 Walls (after turning the 90° corner!)
      { pos: [9.5, 0.25, -22.0], rotY: 0 },
      { pos: [14.5, 0.25, -14.95], rotY: Math.PI },
    ];

    const interactiveExhibits: Array<{
      book: Book;
      bookGroup: THREE.Group;
      nicheGroup: THREE.Group;
      spotlight: THREE.PointLight;
      baseY: number;
    }> = [];

    exhibitBooks.forEach((book, idx) => {
      const spec = exhibitSpecs[idx];
      if (!spec) return;

      const nicheGroup = new THREE.Group();
      nicheGroup.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      nicheGroup.rotation.y = spec.rotY;
      scene.add(nicheGroup);

      // Recessed architectural frame/alcove backing
      const alcoveFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 2.75, 0.26),
        nicheBackMat
      );
      alcoveFrame.position.set(0, 0, -0.05);
      alcoveFrame.receiveShadow = true;
      nicheGroup.add(alcoveFrame);

      // Crisp gallery perimeter moulding
      const borderTop = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.08, 0.32), trimMat);
      borderTop.position.set(0, 1.38, 0);
      nicheGroup.add(borderTop);

      // Minimalist white pedestal shelf
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.72), plinthMat);
      plinth.position.set(0, -1.12, 0.36);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      nicheGroup.add(plinth);

      // Warm overhead niche lamp light
      const lampBar = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.04, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xfff4de })
      );
      lampBar.position.set(0, 1.31, 0.22);
      nicheGroup.add(lampBar);

      const nicheLight = new THREE.PointLight(0xfff0d4, 2.2, 5.5);
      nicheLight.position.set(0, 1.15, 0.55);
      nicheGroup.add(nicheLight);

      // Museum Wall Plaque next to plinth
      const plaqueTex = createWallPlaqueTexture(book, idx);
      const plaque = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.48),
        new THREE.MeshBasicMaterial({ map: plaqueTex })
      );
      plaque.position.set(1.75, -0.25, 0.1);
      nicheGroup.add(plaque);

      // Floating 3D Book inside the lit niche
      const bookGroup = createGalleryBookMesh(book, 0.96);
      const baseY = -0.15;
      bookGroup.position.set(0, baseY, 0.38);
      bookGroup.rotation.y = -0.22;
      bookGroup.traverse((child) => {
        child.userData = { book };
      });
      nicheGroup.add(bookGroup);

      interactiveExhibits.push({
        book,
        bookGroup,
        nicheGroup,
        spotlight: nicheLight,
        baseY,
      });
    });

    // Camera Smooth Architectural Spline through Corridor 1 -> 90° Corner -> Wing 2
    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.45, 3.2),
      new THREE.Vector3(0, 0.35, -3.5),
      new THREE.Vector3(0, 0.35, -10.5),
      new THREE.Vector3(0.4, 0.35, -17.2),
      new THREE.Vector3(4.5, 0.35, -18.5),
      new THREE.Vector3(11.5, 0.35, -18.4),
      new THREE.Vector3(15.5, 0.35, -18.2),
    ]);

    const lookAtPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.4, -3.0),
      new THREE.Vector3(-0.6, 0.25, -8.5),
      new THREE.Vector3(0.4, 0.25, -15.5),
      new THREE.Vector3(2.8, 0.25, -21.2),
      new THREE.Vector3(9.5, 0.25, -20.5),
      new THREE.Vector3(14.5, 0.25, -15.5),
      new THREE.Vector3(18.0, 0.25, -18.0),
    ]);

    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    let hoveredBookId: string | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetPointer.set(nx, ny);

      raycaster.setFromCamera(targetPointer, camera);
      const hits = raycaster.intersectObjects(
        interactiveExhibits.map((ex) => ex.bookGroup),
        true
      );
      if (hits.length > 0) {
        const hitBook = hits[0].object.userData?.book as Book | undefined;
        if (hitBook) {
          hoveredBookId = hitBook.id;
          renderer.domElement.style.cursor = "pointer";
          setHoveredExhibit({
            book: hitBook,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }
      hoveredBookId = null;
      renderer.domElement.style.cursor = "grab";
      setHoveredExhibit(null);
    };

    const handleClick = () => {
      raycaster.setFromCamera(targetPointer, camera);
      const hits = raycaster.intersectObjects(
        interactiveExhibits.map((ex) => ex.bookGroup),
        true
      );
      if (hits.length > 0) {
        const hitBook = hits[0].object.userData?.book as Book | undefined;
        if (hitBook) {
          onInspectRef.current(hitBook);
        }
      }
    };

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 1000;
      const nh = container.clientHeight || 720;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointermove", handlePointerMove);
    dom.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let rafId = 0;
    let smoothT = Math.min(1, Math.max(0, progressRef.current));

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();
      const targetT = Math.min(0.98, Math.max(0, progressRef.current));
      smoothT += (targetT - smoothT) * (caps.reducedMotion ? 0.3 : 0.085);

      pointer.lerp(targetPointer, 0.06);

      const camPos = cameraPath.getPointAt(smoothT);
      const lookPos = lookAtPath.getPointAt(smoothT);

      camera.position.set(
        camPos.x + pointer.x * 0.38,
        camPos.y + pointer.y * 0.22,
        camPos.z
      );
      camera.lookAt(
        lookPos.x + pointer.x * 0.5,
        lookPos.y + pointer.y * 0.3,
        lookPos.z
      );

      // Gentle wire sign sway
      if (!caps.reducedMotion) {
        wireSignGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.012;
      }

      // Animate floating 3D books & spotlights inside niches
      interactiveExhibits.forEach((ex, i) => {
        const isHovered = ex.book.id === hoveredBookId;
        const targetIntensity = isHovered ? 4.4 : 2.1;
        ex.spotlight.intensity += (targetIntensity - ex.spotlight.intensity) * 0.12;

        if (!caps.reducedMotion) {
          ex.bookGroup.position.y = ex.baseY + Math.sin(elapsed * 1.3 + i) * 0.045;
          const targetRot = isHovered ? 0.15 : -0.22 + Math.sin(elapsed * 0.6 + i) * 0.12;
          ex.bookGroup.rotation.y += (targetRot - ex.bookGroup.rotation.y) * 0.08;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [books, caps.ready, caps.webglSupported, caps.reducedMotion, caps.isMobile]);

  if (caps.ready && !caps.webglSupported) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f5f4ef] p-8">
        <div className="grid max-w-4xl gap-6 sm:grid-cols-3">
          {books.slice(0, 3).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onInspectBook(b)}
              className="rounded-2xl border border-[#dedbd2] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d93829]">
                {b.category}
              </span>
              <h3 className="mt-2 font-serif text-xl font-semibold text-[#141413]">
                {b.title}
              </h3>
              <p className="mt-1 text-xs text-[#62605a]">{b.authorName}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Minimaze-inspired 3D Light Gallery Walkthrough"
      />

      {/* Interactive Niche Plaque Tooltip */}
      {hoveredExhibit && (
        <div
          className="pointer-events-none absolute z-30 w-64 rounded-2xl border border-[#dedbd2] bg-white/95 p-3.5 text-left shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(Math.max(hoveredExhibit.x + 16, 16), 440),
            top: Math.max(hoveredExhibit.y - 36, 80),
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#62605a]">
              {hoveredExhibit.book.category}
            </span>
          </div>
          <p className="mt-1 font-serif text-lg font-semibold leading-snug text-[#141413]">
            {hoveredExhibit.book.title}
          </p>
          <p className="text-xs text-[#62605a]">{hoveredExhibit.book.authorName}</p>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#eceae3] pt-2 text-xs">
            <span className="font-mono font-bold text-[#141413]">
              {formatPrice(hoveredExhibit.book.price)}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#d93829]">
              Zoom In <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Subtle Bottom-Right Spatial Hint */}
      <div className="pointer-events-none absolute bottom-5 right-5 z-20 hidden items-center gap-2 rounded-full border border-[#dedbd2] bg-white/85 px-4 py-2 font-mono text-[11px] text-[#141413] shadow-sm backdrop-blur-md sm:flex">
        <Sparkles className="h-3.5 w-3.5 text-[#d93829]" />
        <span>Scroll to walk the 3D gallery • Click any lit niche</span>
      </div>
    </div>
  );
}

