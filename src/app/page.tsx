"use client";

import { useEffect, useState, useCallback } from "react";
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
import { ExportBar, Footer, settingsFromUrl } from "@/components/export-bar";
import { useDitherImage } from "@/lib/use-dither";
import { DEFAULT_SETTINGS, DitherSettings } from "@/lib/dither-types";

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
        <section className="border-b border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="font-sans text-2xl font-black tracking-tight md:text-3xl">
                  dither
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Drop an image, dial in the settings, ship a dither. Runs
                  entirely in your browser — no upload, no signup.
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  100% client-side
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Shareable URLs
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Embeddable
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="flex min-w-0 flex-col gap-4">
              {image ? (
                <>
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
                </>
              ) : (
                <>
                  <Dropzone
                    onFile={handleFile}
                    onSample={handleSample}
                    className="min-h-[480px]"
                  />
                  {status === "error" && error && (
                    <p className="text-center font-mono text-xs text-destructive">
                      {error}
                    </p>
                  )}
                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    or paste an image with Ctrl/⌘ + V
                  </p>
                </>
              )}
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
      </main>
      <Footer />
    </>
  );
}
