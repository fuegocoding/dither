"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconPhoto,
} from "@tabler/icons-react";
import { Nav } from "@/components/nav";
import { Dropzone, SAMPLE_IMAGE } from "@/components/dropzone";
import { DitherPreview } from "@/components/dither-preview";
import { SettingsPanel } from "@/components/settings-panel";
import { ExportBar, Footer, settingsFromUrl, duotoneVariantSettings } from "@/components/export-bar";
import { useDitherImage } from "@/lib/use-dither";
import { DEFAULT_SETTINGS, DitherSettings } from "@/lib/dither-types";

export default function Home() {
  const { image, status, error, imgRef, loadFromFile, loadFromUrl, clear } =
    useDitherImage();
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const siteTheme: "light" | "dark" | null =
    mounted && (resolvedTheme === "light" || resolvedTheme === "dark")
      ? resolvedTheme
      : null;

  const heroRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDuotone = settings.colorMode === "duotone";
  const effectiveSettings = useMemo(() => {
    if (isDuotone && siteTheme) {
      return duotoneVariantSettings(settings, siteTheme);
    }
    return settings;
  }, [isDuotone, siteTheme, settings]);

  useEffect(() => {
    const fromUrl = settingsFromUrl();
    if (Object.keys(fromUrl).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings({ ...DEFAULT_SETTINGS, ...fromUrl });
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            loadFromFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFromFile]);

  useEffect(() => {
    if (image && workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [image]);

  const onReset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const handleFile = useCallback(
    (file: File) => loadFromFile(file),
    [loadFromFile],
  );

  const handleSample = useCallback(
    () => loadFromUrl(SAMPLE_IMAGE),
    [loadFromUrl],
  );

  const handleClear = useCallback(() => {
    clear();
    if (heroRef.current) {
      heroRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [clear]);

  return (
    <>
      <Nav />
      <main>
        <section
          ref={heroRef}
          className="relative isolate min-h-screen w-full overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <img
              src="/hero-light.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover dark:hidden"
            />
            <img
              src="/hero-dark.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover hidden dark:block"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
          </div>

          <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-24 pb-12 md:px-6 md:pt-32 md:pb-16">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <h1 className="font-sans text-4xl font-black tracking-tight md:text-6xl">
                Dither
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                Drop an image, dial in the settings, and ship a pixel-perfect
                dither. Runs entirely in your browser — no upload, no signup.
              </p>
            </div>
            <div className="w-full max-w-2xl">
              <Dropzone
                onFile={handleFile}
                onSample={handleSample}
                className="min-h-[280px] md:min-h-[360px]"
              />
              {status === "error" && error && (
                <p className="mt-3 text-center font-mono text-xs text-destructive">
                  {error}
                </p>
              )}
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                or paste an image with Ctrl/⌘ + V
              </p>
            </div>
          </div>
        </section>

        {image && (
          <section
            ref={workspaceRef}
            className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 scroll-mt-20"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <IconPhoto className="size-4 shrink-0 text-primary" />
                    <span className="truncate font-sans text-sm font-bold text-foreground">
                      {image.name}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {image.width}×{image.height}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen((v) => !v)}
                      className="text-muted-foreground"
                    >
                      {isFullscreen ? (
                        <IconArrowsMinimize className="size-3.5" />
                      ) : (
                        <IconArrowsMaximize className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-muted-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <DitherPreview
                  image={image}
                  imgRef={imgRef}
                  settings={effectiveSettings}
                  className={cn(
                    "min-h-[400px] w-full",
                    isFullscreen
                      ? "h-[calc(100vh-12rem)]"
                      : "aspect-[4/3] md:aspect-[16/10]",
                  )}
                />

                <ExportBar
                  image={image}
                  imgRef={imgRef}
                  settings={settings}
                  effectiveSettings={isDuotone && siteTheme ? effectiveSettings : undefined}
                />
              </div>

              <Card className="h-fit lg:sticky lg:top-20">
                <CardContent className="p-5">
                  <SettingsPanel
                    settings={settings}
                    effectiveSettings={isDuotone && siteTheme ? effectiveSettings : undefined}
                    onChange={setSettings}
                    onReset={onReset}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
