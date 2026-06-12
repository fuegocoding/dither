"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DitherImage, useDitherPreview } from "@/lib/use-dither";
import { DitherSettings } from "@/lib/dither-types";

interface DitherPreviewProps {
  image: DitherImage;
  imgRef: React.RefObject<HTMLImageElement | null>;
  settings: DitherSettings;
  className?: string;
  maxDim?: number;
  showCheckerboard?: boolean;
}

export function DitherPreview({
  image,
  imgRef,
  settings,
  className,
  maxDim = 720,
  showCheckerboard = true,
}: DitherPreviewProps) {
  const { canvasRef, render, startAnimation, stopAnimation } = useDitherPreview(
    imgRef,
    image,
  );
  const [containerSize, setContainerSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ w: width, h: height });
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const customPaletteKey = settings.customPalette.join(",");

  useEffect(() => {
    stopAnimation();
    if (settings.animated) {
      const stop = startAnimation(settings, maxDim);
      return stop;
    } else {
      render(settings, maxDim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    image.src,
    settings.gridSize,
    settings.ditherMode,
    settings.colorMode,
    settings.invert,
    settings.pixelRatio,
    settings.primaryColor,
    settings.secondaryColor,
    customPaletteKey,
    settings.brightness,
    settings.contrast,
    settings.threshold,
    settings.backgroundColor,
    settings.animated,
    settings.animationSpeed,
    settings.objectFit,
    maxDim,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden border border-border bg-card",
        showCheckerboard && settings.backgroundColor === "transparent" && "checkered-bg",
        className,
      )}
      style={
        settings.backgroundColor !== "transparent"
          ? { backgroundColor: settings.backgroundColor }
          : undefined
      }
    >
      <canvas
        ref={canvasRef}
        className="block max-h-full max-w-full"
        style={{ imageRendering: "pixelated" }}
        aria-label="Dithered image preview"
      />
      {containerSize && (
        <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>
            {image.width}×{image.height}
          </span>
        </div>
      )}
    </div>
  );
}
