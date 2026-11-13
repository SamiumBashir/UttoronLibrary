"use client";

import { useEffect, useState } from "react";

export interface EnvironmentCapabilities {
  ready: boolean;
  webglSupported: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
}

export function useEnvironmentCapabilities(): EnvironmentCapabilities {
  const [caps, setCaps] = useState<EnvironmentCapabilities>({
    ready: false,
    webglSupported: true,
    reducedMotion: false,
    isMobile: false,
  });

  useEffect(() => {
    let webglSupported = false;
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      webglSupported = Boolean(gl);
    } catch {
      webglSupported = false;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setCaps({
        ready: true,
        webglSupported,
        reducedMotion: motionQuery.matches,
        isMobile: mobileQuery.matches,
      });
    };

    update();
    motionQuery.addEventListener("change", update);
    mobileQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", update);
    };
  }, []);

  return caps;
}

