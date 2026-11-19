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

function createDoorArchSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = "#b08b46";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 1008, 240);
  ctx.strokeStyle = "#141413";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 988, 220);

  // Red seal
  ctx.fillStyle = "#d93829";
  ctx.beginPath();
  ctx.arc(68, 72, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#62605a";
  ctx.font = "600 24px monospace";
  ctx.fillText("THE PUBLISHING HOUSE • EST. 1998", 98, 80);

  ctx.fillStyle = "#141413";
  ctx.font = "700 50px Georgia, serif";
  ctx.fillText("MAIN BINDERY & EDITORIAL HALL", 48, 156);

  ctx.fillStyle = "#b08b46";
  ctx.font = "600 22px monospace";
  ctx.fillText("STEPPING INSIDE • UTTORON PROKASONI", 48, 206);

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

    const calcFov = (w: number, h: number) => {
      const aspect = w / h;
      if (aspect >= 1.2) return 46;
      return Math.min(74, Math.round(46 / Math.max(0.55, aspect)));
    };

    // Bright Minimaze-Light Museum White Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f4ef);
    scene.fog = new THREE.Fog(0xf5f4ef, 12, 34);

    const camera = new THREE.PerspectiveCamera(calcFov(width, height), width / height, 0.1, 70);

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

    // Architectural Materials (White Plaster, Pale Stone Floor, Recessed Niche Shadow, Interior Woods & Brass)
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
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc49b45,
      roughness: 0.28,
      metalness: 0.82,
    });
    const woodFloorMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb8,
      roughness: 0.58,
      metalness: 0.08,
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3d352e,
      roughness: 0.65,
    });
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3eb,
      roughness: 0.9,
    });

    // Gallery Architectural Floor & Ceiling (extended into inner room)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(54, 56), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(11, -2.2, -14);
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(54, 56), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(11, 3.6, -14);
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

    // Corner Back Wall: extends along -Z = -22.5 from corner past doorway to inner room
    const cornerWall = new THREE.Mesh(new THREE.BoxGeometry(38, 5.8, 0.4), wallMat);
    cornerWall.position.set(14.0, 0.7, -22.5);
    cornerWall.receiveShadow = true;
    scene.add(cornerWall);

    // Wing 2 South Wall: runs along +X at z = -14.5 after corner into inner room
    const wing2FrontWall = new THREE.Mesh(new THREE.BoxGeometry(28, 5.8, 0.4), wallMat);
    wing2FrontWall.position.set(18.0, 0.7, -14.5);
    wing2FrontWall.receiveShadow = true;
    scene.add(wing2FrontWall);

    // Far East Wall: closing wall of the inner publishing hall at x = 32.0
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.8, 8.4), wallMat);
    eastWall.position.set(32.0, 0.7, -18.5);
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // GRAND ARCHITECTURAL DOORWAY / PORTAL AT x = 18.0
    // North door jamb
    const doorJambNorth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.8, 1.9), wallMat);
    doorJambNorth.position.set(18.0, 0.7, -21.55);
    doorJambNorth.receiveShadow = true;
    scene.add(doorJambNorth);

    // South door jamb
    const doorJambSouth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.8, 1.9), wallMat);
    doorJambSouth.position.set(18.0, 0.7, -15.45);
    doorJambSouth.receiveShadow = true;
    scene.add(doorJambSouth);

    // Doorway Arch Lintel overhead
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.7, 4.4), wallMat);
    doorLintel.position.set(18.0, 2.75, -18.5);
    doorLintel.receiveShadow = true;
    scene.add(doorLintel);

    // Door Pillars & Architectural Trim
    const pillarNorth = new THREE.Mesh(new THREE.BoxGeometry(0.58, 5.8, 0.22), trimMat);
    pillarNorth.position.set(17.9, 0.7, -20.65);
    scene.add(pillarNorth);

    const pillarSouth = new THREE.Mesh(new THREE.BoxGeometry(0.58, 5.8, 0.22), trimMat);
    pillarSouth.position.set(17.9, 0.7, -16.35);
    scene.add(pillarSouth);

    const archTrim = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 4.5), trimMat);
    archTrim.position.set(17.9, 1.9, -18.5);
    scene.add(archTrim);

    // Brass Threshold Floor Strip
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 4.3), brassMat);
    threshold.position.set(18.0, -2.185, -18.5);
    scene.add(threshold);

    // Grand Arch Signboard above the doorway
    const archSignTex = createDoorArchSignTexture();
    const archSignBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.85, 3.4),
      [
        trimMat,
        new THREE.MeshStandardMaterial({ map: archSignTex, roughness: 0.35 }),
        trimMat,
        trimMat,
        trimMat,
        trimMat,
      ]
    );
    archSignBoard.position.set(17.72, 2.5, -18.5);
    scene.add(archSignBoard);

    // INNER PUBLISHING HOUSE ROOM (x = 18.5 to 31.0)
    // Warm parquet / wood floor rug inlay
    const innerRug = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.6), woodFloorMat);
    innerRug.rotation.x = -Math.PI / 2;
    innerRug.position.set(24.5, -2.19, -18.5);
    innerRug.receiveShadow = true;
    scene.add(innerRug);

    // Warm golden interior illumination casting through the doorway
    const interiorWarmLight = new THREE.PointLight(0xffdfa8, 3.8, 20);
    interiorWarmLight.position.set(23.0, 1.8, -18.5);
    scene.add(interiorWarmLight);

    const interiorFillLight = new THREE.PointLight(0xffeed6, 2.0, 14);
    interiorFillLight.position.set(28.0, 1.0, -18.5);
    scene.add(interiorFillLight);

    // Architectural Walnut Library Bookshelf on North Wall (Open, multi-tiered bookcase)
    const bookcaseGroup = new THREE.Group();
    scene.add(bookcaseGroup);

    // 1. Back panel (thin, flush against wall)
    const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(9.4, 4.7, 0.06), darkWoodMat);
    shelfBack.position.set(24.5, 0.15, -22.42);
    shelfBack.receiveShadow = true;
    bookcaseGroup.add(shelfBack);

    // 2. Outer side uprights (left & right gables)
    const shelfGableLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 0.62), darkWoodMat);
    shelfGableLeft.position.set(19.85, 0.15, -22.12);
    bookcaseGroup.add(shelfGableLeft);

    const shelfGableRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 0.62), darkWoodMat);
    shelfGableRight.position.set(29.15, 0.15, -22.12);
    bookcaseGroup.add(shelfGableRight);

    // 3. Top cornice & bottom base plinth
    const shelfCornice = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.16, 0.7), darkWoodMat);
    shelfCornice.position.set(24.5, 2.45, -22.1);
    bookcaseGroup.add(shelfCornice);

    const shelfPlinth = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.22, 0.64), darkWoodMat);
    shelfPlinth.position.set(24.5, -2.1, -22.12);
    bookcaseGroup.add(shelfPlinth);

    // 4. Vertical internal bay dividers (creating 3 architectural bays)
    [22.95, 26.05].forEach((vx) => {
      const divider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.4, 0.58), darkWoodMat);
      divider.position.set(vx, 0.1, -22.13);
      bookcaseGroup.add(divider);
    });

    // 5. Horizontal shelves (4 tiers)
    const shelfLevels = [-1.35, -0.45, 0.45, 1.35, 2.25];
    shelfLevels.forEach((sy) => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.07, 0.58), trimMat);
      board.position.set(24.5, sy, -22.13);
      board.receiveShadow = true;
      bookcaseGroup.add(board);

      // Brass front edge lip
      const lip = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.03, 0.02), brassMat);
      lip.position.set(24.5, sy - 0.02, -21.83);
      bookcaseGroup.add(lip);
    });

    // 6. Populate every shelf level with books
    const shelfBookColors = [
      0x722f37, // Burgundy
      0x1d3557, // Deep Navy
      0x2d4a3e, // Forest Green
      0xc49b45, // Archival Gold
      0x593d2b, // Leather Amber
      0x252525, // Charcoal
      0x8b3a44, // Crimson
      0x3d405b, // Slate
      0xa84b38, // Terracotta
      0xd4af37, // Warm Brass
    ];

    [-1.35, -0.45, 0.45, 1.35].forEach((shelfY, tierIdx) => {
      const bays = [
        [20.05, 22.85],
        [23.15, 25.95],
        [26.25, 29.05],
      ];

      bays.forEach(([minX, maxX], bayIdx) => {
        let bx = minX;
        let cIdx = tierIdx * 3 + bayIdx * 5;

        // Occasional horizontal stack in some bays
        if ((tierIdx + bayIdx) % 3 === 1) {
          const stackW = 0.48;
          for (let s = 0; s < 3; s++) {
            const stackBook = new THREE.Mesh(
              new THREE.BoxGeometry(stackW - s * 0.04, 0.07, 0.42),
              new THREE.MeshStandardMaterial({
                color: shelfBookColors[(cIdx + s) % shelfBookColors.length],
                roughness: 0.55,
              })
            );
            stackBook.position.set(bx + stackW / 2, shelfY + 0.035 + s * 0.075, -22.06);
            bookcaseGroup.add(stackBook);
          }
          bx += stackW + 0.06;
        }

        while (bx < maxX - 0.12) {
          const bW = 0.06 + (Math.sin(bx * 9 + tierIdx) * 0.5 + 0.5) * 0.08;
          const bH = 0.62 + (Math.cos(bx * 7 + tierIdx) * 0.5 + 0.5) * 0.22;
          const bMat = new THREE.MeshStandardMaterial({
            color: shelfBookColors[cIdx % shelfBookColors.length],
            roughness: 0.55,
          });
          const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, 0.44), bMat);

          if (bx > maxX - 0.28) {
            bookMesh.rotation.z = -0.16;
            bookMesh.position.set(bx + bW / 2 + 0.04, shelfY + bH / 2, -22.06);
          } else {
            bookMesh.position.set(bx + bW / 2, shelfY + bH / 2 + 0.035, -22.06);
          }
          bookcaseGroup.add(bookMesh);
          bx += bW + 0.02;
          cIdx++;
        }
      });
    });

    // Bookshelf warm accent lighting
    const shelfWarmLight = new THREE.PointLight(0xffeed6, 2.2, 12);
    shelfWarmLight.position.set(24.5, 2.1, -21.4);
    bookcaseGroup.add(shelfWarmLight);

    // Manuscript drafting table on South Wall
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 1.8), darkWoodMat);
    tableTop.position.set(24.5, -1.1, -15.5);
    scene.add(tableTop);

    [
      [21.8, -15.8],
      [21.8, -15.2],
      [27.2, -15.8],
      [27.2, -15.2],
    ].forEach(([tx, tz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), darkWoodMat);
      leg.position.set(tx, -1.65, tz);
      scene.add(leg);
    });

    const paperStack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.9), paperMat);
    paperStack.position.set(23.6, -0.98, -15.5);
    scene.add(paperStack);

    const deskLamp = new THREE.PointLight(0xffdd99, 1.8, 4.5);
    deskLamp.position.set(26.2, -0.4, -15.4);
    scene.add(deskLamp);

    const deskLampMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.18, 0.25),
      brassMat
    );
    deskLampMesh.position.set(26.2, -0.7, -15.4);
    scene.add(deskLampMesh);

    // East Wall: Framed Gallery Photograph (User's 3rd Picture: Bengali Literary Exhibition)
    const galleryPhotoGroup = new THREE.Group();
    scene.add(galleryPhotoGroup);

    // 1. Outer Deep Architectural Beveled Frame
    const photoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 3.52, 4.62),
      darkWoodMat
    );
    photoFrame.position.set(31.86, 0.8, -18.5);
    photoFrame.receiveShadow = true;
    galleryPhotoGroup.add(photoFrame);

    // 2. Brass inner frame rim
    const photoFrameRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 3.32, 4.42),
      brassMat
    );
    photoFrameRim.position.set(31.83, 0.8, -18.5);
    galleryPhotoGroup.add(photoFrameRim);

    // 3. Archival Passe-Partout (Mat Board)
    const matBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(4.38, 3.28),
      new THREE.MeshStandardMaterial({ color: 0xf8f7f3, roughness: 0.85 })
    );
    matBoard.rotation.y = -Math.PI / 2;
    matBoard.position.set(31.75, 0.8, -18.5);
    galleryPhotoGroup.add(matBoard);

    // 4. Exhibition Photograph Print (User's 3rd Picture: Bengali Books in Wicker Basket)
    const texLoader = new THREE.TextureLoader();
    const photoTexture = texLoader.load("/images/gallery/exhibition-books.jpg");
    photoTexture.colorSpace = THREE.SRGBColorSpace;

    const photoPrintMat = new THREE.MeshStandardMaterial({
      map: photoTexture,
      roughness: 0.32,
      metalness: 0.04,
    });
    // Natural aspect ratio: 4.1m width x 3.03m height (~1.35)
    const photoPrint = new THREE.Mesh(
      new THREE.PlaneGeometry(4.1, 3.03),
      photoPrintMat
    );
    photoPrint.rotation.y = -Math.PI / 2;
    photoPrint.position.set(31.74, 0.8, -18.5);
    galleryPhotoGroup.add(photoPrint);

    // 5. Overhead Gallery Picture Lamp
    const pictureLampFixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.06, 1.4),
      brassMat
    );
    pictureLampFixture.position.set(31.35, 2.7, -18.5);
    galleryPhotoGroup.add(pictureLampFixture);

    const pictureLampArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.5),
      brassMat
    );
    pictureLampArm.rotation.z = Math.PI / 4;
    pictureLampArm.position.set(31.55, 2.65, -18.5);
    galleryPhotoGroup.add(pictureLampArm);

    // Warm gallery picture light casting down onto the photograph
    const pictureSpotLight = new THREE.SpotLight(0xfff5dd, 4.5, 8, Math.PI / 4, 0.45);
    pictureSpotLight.position.set(30.6, 2.8, -18.5);
    pictureSpotLight.target.position.set(31.74, 0.8, -18.5);
    galleryPhotoGroup.add(pictureSpotLight);
    galleryPhotoGroup.add(pictureSpotLight.target);

    // 6. Museum Plaque under the frame
    const museumPlaqueCanvas = document.createElement("canvas");
    museumPlaqueCanvas.width = 512;
    museumPlaqueCanvas.height = 128;
    const mpCtx = museumPlaqueCanvas.getContext("2d")!;
    mpCtx.fillStyle = "#ffffff";
    mpCtx.fillRect(0, 0, 512, 128);
    mpCtx.strokeStyle = "#DDD9D1";
    mpCtx.lineWidth = 4;
    mpCtx.strokeRect(2, 2, 508, 124);
    mpCtx.fillStyle = "#722F37";
    mpCtx.font = "bold 20px 'Hind Siliguri', sans-serif";
    mpCtx.fillText("উত্তরণ সাহিত্য প্রদর্শনী", 32, 48);
    mpCtx.fillStyle = "#252525";
    mpCtx.font = "600 14px monospace";
    mpCtx.fillText("BENGALI LITERARY ARCHIVE & FOLIO", 32, 78);
    mpCtx.fillStyle = "#77736D";
    mpCtx.font = "12px sans-serif";
    mpCtx.fillText("Curated Rare Editions & Living Bookcraft", 32, 102);

    const museumPlaqueTex = new THREE.CanvasTexture(museumPlaqueCanvas);
    museumPlaqueTex.colorSpace = THREE.SRGBColorSpace;
    const museumPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ map: museumPlaqueTex })
    );
    museumPlaque.rotation.y = -Math.PI / 2;
    museumPlaque.position.set(31.73, -1.18, -18.5);
    galleryPhotoGroup.add(museumPlaque);

    // Architectural Ceiling Light Coves (glowing minimalist strips continuing into inner room)
    const coveMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let z = 1; z >= -19; z -= 4) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.18), coveMat);
      strip.position.set(0, 3.55, z);
      scene.add(strip);
    }
    for (let x = 4; x <= 28; x += 4) {
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

    // Camera Smooth Architectural Spline through Corridor 1 -> 90° Corner -> Wing 2 -> Grand Archway -> Interior Hall!
    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.45, 3.2),
      new THREE.Vector3(0, 0.35, -3.5),
      new THREE.Vector3(0, 0.35, -10.5),
      new THREE.Vector3(0.4, 0.35, -17.2),
      new THREE.Vector3(4.5, 0.35, -18.5),
      new THREE.Vector3(11.5, 0.35, -18.4),
      new THREE.Vector3(15.5, 0.35, -18.5),
      new THREE.Vector3(18.2, 0.35, -18.5),
      new THREE.Vector3(22.0, 0.35, -18.5),
    ]);

    const lookAtPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.4, -3.0),
      new THREE.Vector3(-0.6, 0.25, -8.5),
      new THREE.Vector3(0.4, 0.25, -15.5),
      new THREE.Vector3(2.8, 0.25, -21.2),
      new THREE.Vector3(9.5, 0.25, -20.5),
      new THREE.Vector3(15.0, 0.30, -18.5),
      new THREE.Vector3(19.0, 0.35, -18.5),
      new THREE.Vector3(25.0, 0.40, -18.5),
      new THREE.Vector3(30.0, 0.45, -18.5),
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
      camera.fov = calcFov(nw, nh);
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
      const targetT = Math.min(1.0, Math.max(0, progressRef.current));
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
      archSignTex.dispose();
      signTex.dispose();
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

