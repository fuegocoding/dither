"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DitherImage, useDitherPreview } from "@/lib/use-dither";
import { DitherSettings } from "@/lib/dither-types";
import { duotoneVariantSettings } from "@/components/export-bar";

interface DitherPreviewProps {
  image: DitherImage;
  imgRef: React.RefObject<HTMLImageElement | null>;
  settings: DitherSettings;
  siteTheme?: "light" | "dark" | null;
  className?: string;
  maxDim?: number;
  showCheckerboard?: boolean;
}

export function DitherPreview({
  image,
  imgRef,
  settings,
  siteTheme,
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

  const isDuotone = settings.colorMode === "duotone";
  const effectiveSettings = useMemo(() => {
    if (isDuotone && siteTheme) {
      return duotoneVariantSettings(settings, siteTheme);
    }
    return settings;
  }, [isDuotone, siteTheme, settings]);

  const customPaletteKey = effectiveSettings.customPalette.join(",");

  useEffect(() => {
    stopAnimation();
    if (effectiveSettings.animated) {
      const stop = startAnimation(effectiveSettings, maxDim);
      return stop;
    } else {
      render(effectiveSettings, maxDim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    image.src,
    effectiveSettings.gridSize,
    effectiveSettings.ditherMode,
    effectiveSettings.colorMode,
    effectiveSettings.invert,
    effectiveSettings.pixelRatio,
    effectiveSettings.primaryColor,
    effectiveSettings.secondaryColor,
    customPaletteKey,
    effectiveSettings.brightness,
    effectiveSettings.contrast,
    effectiveSettings.threshold,
    effectiveSettings.backgroundColor,
    effectiveSettings.animated,
    effectiveSettings.animationSpeed,
    effectiveSettings.objectFit,
    maxDim,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden border border-border bg-card",
        showCheckerboard &&
          effectiveSettings.backgroundColor === "transparent" &&
          "checkered-bg",
        className,
      )}
      style={
        effectiveSettings.backgroundColor !== "transparent"
          ? { backgroundColor: effectiveSettings.backgroundColor }
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
