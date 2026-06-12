"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconBolt,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconPhoto,
  IconPalette,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { Nav } from "@/components/nav";
import { Dropzone, SAMPLE_IMAGE } from "@/components/dropzone";
import { DitherPreview } from "@/components/dither-preview";
import { SettingsPanel } from "@/components/settings-panel";
import { ExportBar, Footer, settingsFromUrl } from "@/components/export-bar";
import { useDitherImage } from "@/lib/use-dither";
import { DEFAULT_SETTINGS, DitherSettings } from "@/lib/dither-types";

const FEATURES = [
  {
    icon: IconBolt,
    title: "Live preview",
    description: "See every tweak the moment you change a slider.",
  },
  {
    icon: IconPalette,
    title: "Duotone & palette",
    description: "Two colors or up to eight. Built-in Game Boy, CGA, and more.",
  },
  {
    icon: IconArrowsMaximize,
    title: "Bayer, halftone, noise",
    description: "Four dither algorithms from classic to TV-static.",
  },
  {
    icon: IconPlayerPlay,
    title: "Animated dither",
    description: "Bring your image to life with shimmering noise patterns.",
  },
];

function HeroHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--primary)_0%,transparent_40%),radial-gradient(circle_at_70%_80%,var(--primary)_0%,transparent_40%)] opacity-20" />
      </div>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center md:px-8 md:py-28">
        <Badge variant="secondary" className="font-mono">
          <IconBolt className="size-3" />
          v0.1 · for fuego.im
        </Badge>
        <h1 className="font-sans text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70 leading-[1.05] md:text-7xl">
          Drop an image.
          <br />
          Ship a dither.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
          A pixel-perfect dithering utility that runs entirely in your browser.
          Pick an algorithm, dial in the colors, animate it, and download — no
          uploads, no servers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            100% client-side
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            No signup
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            Shareable URLs
          </span>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col gap-2 bg-background p-6"
          >
            <f.icon className="size-5 text-primary" />
            <span className="font-sans text-sm font-bold text-foreground">
              {f.title}
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { image, status, error, imgRef, loadFromFile, loadFromUrl, clear } =
    useDitherImage();
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const onReset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const handleFile = useCallback(
    (file: File) => loadFromFile(file),
    [loadFromFile],
  );

  const handleSample = useCallback(
    () => loadFromUrl(SAMPLE_IMAGE),
    [loadFromUrl],
  );

  return (
    <>
      <Nav />
      <main>
        {!image ? (
          <>
            <HeroHero />
            <section className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-20">
              <Dropzone
                onFile={handleFile}
                onSample={handleSample}
                className="border-2"
              />
              {status === "error" && error && (
                <p className="mt-4 text-center font-mono text-xs text-destructive">
                  {error}
                </p>
              )}
              <div className="mt-8 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  or paste an image with Ctrl/⌘ + V
                </p>
              </div>
            </section>
            <FeatureGrid />
          </>
        ) : (
          <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconPhoto className="size-4 text-primary shrink-0" />
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
                      onClick={clear}
                      className="text-muted-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <DitherPreview
                  image={image}
                  imgRef={imgRef}
                  settings={settings}
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
                />
              </div>

              <Card className="h-fit lg:sticky lg:top-20">
                <CardContent className="p-5">
                  <SettingsPanel
                    settings={settings}
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
