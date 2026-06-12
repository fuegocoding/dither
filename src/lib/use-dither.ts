"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DitherSettings } from "./dither-types";
import { renderDither } from "./dither-engine";

export type DitherStatus = "idle" | "loading" | "ready" | "error";

export interface DitherImage {
  src: string;
  width: number;
  height: number;
  name: string;
  file?: File;
}

export function useDitherImage() {
  const [image, setImage] = useState<DitherImage | null>(null);
  const [status, setStatus] = useState<DitherStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadFromSrc = useCallback(
    (src: string, name = "image", file?: File) => {
      setStatus("loading");
      setError(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        setImage({
          src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name,
          file,
        });
        setStatus("ready");
      };
      img.onerror = () => {
        setError("Failed to load image");
        setStatus("error");
      };
      img.src = src;
    },
    [],
  );

  const loadFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          loadFromSrc(dataUrl, file.name, file);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setStatus("error");
      };
      reader.readAsDataURL(file);
    },
    [loadFromSrc],
  );

  const loadFromUrl = useCallback(
    (url: string) => loadFromSrc(url, url.split("/").pop() || "image"),
    [loadFromSrc],
  );

  const clear = useCallback(() => {
    imgRef.current = null;
    setImage(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    image,
    status,
    error,
    imgRef,
    loadFromSrc,
    loadFromFile,
    loadFromUrl,
    clear,
  };
}

export interface DitherPreviewHandle {
  render: (settings: DitherSettings, maxDim?: number) => void;
  startAnimation: (settings: DitherSettings, maxDim?: number) => () => void;
  stopAnimation: () => void;
  renderFull: (
    settings: DitherSettings,
    maxDim?: number,
  ) => HTMLCanvasElement | null;
  canvas: HTMLCanvasElement | null;
}

export function useDitherPreview(
  imgRef: React.RefObject<HTMLImageElement | null>,
  image: DitherImage | null,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const sizeFor = useCallback(
    (maxDim: number) => {
      if (!image) return { w: 0, h: 0 };
      const aspect = image.width / image.height;
      if (aspect >= 1) {
        return {
          w: Math.min(maxDim, image.width),
          h: Math.round((Math.min(maxDim, image.width) / aspect)),
        };
      }
      return {
        w: Math.round((Math.min(maxDim, image.height) * aspect)),
        h: Math.min(maxDim, image.height),
      };
    },
    [image],
  );

  const render = useCallback(
    (settings: DitherSettings, maxDim = 720) => {
      if (!imgRef.current || !image || !canvasRef.current) return;
      try {
        const { w, h } = sizeFor(maxDim);
        if (w === 0 || h === 0) return;
        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        renderDither(imgRef.current, canvas, settings, 0);
      } catch (e) {
        console.error("Dither render failed:", e);
      }
    },
    [imgRef, image, sizeFor],
  );

  const renderFull = useCallback(
    (settings: DitherSettings, maxDim = 2400): HTMLCanvasElement | null => {
      if (!imgRef.current || !image) return null;
      try {
        const { w, h } = sizeFor(maxDim);
        if (w === 0 || h === 0) return null;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        renderDither(imgRef.current, canvas, settings, 0);
        return canvas;
      } catch (e) {
        console.error("Dither renderFull failed:", e);
        return null;
      }
    },
    [imgRef, image, sizeFor],
  );

  const startAnimation = useCallback(
    (settings: DitherSettings, maxDim = 720) => {
      if (!imgRef.current || !image || !canvasRef.current) return () => {};
      try {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        timeRef.current = 0;
        const { w, h } = sizeFor(maxDim);
        if (w === 0 || h === 0) return () => {};
        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return () => {};
        ctx.resetTransform();
        ctx.scale(dpr, dpr);

        const loop = () => {
          if (!imgRef.current || !image || !canvasRef.current) return;
          try {
            timeRef.current += settings.animationSpeed;
            renderDither(
              imgRef.current,
              canvasRef.current,
              settings,
              timeRef.current,
            );
          } catch (e) {
            console.error("Dither animation frame failed:", e);
            return;
          }
          animationRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        console.error("Dither startAnimation failed:", e);
        return () => {};
      }
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    },
    [imgRef, image, sizeFor],
  );

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return { canvasRef, render, renderFull, startAnimation, stopAnimation };
}
