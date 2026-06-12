"use client";

import { useState, useMemo } from "react";
import { DitherSettings } from "@/lib/dither-types";
import { DitherImage } from "@/lib/use-dither";
import { renderDither } from "@/lib/dither-engine";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  IconDownload,
  IconCopy,
  IconCheck,
  IconBrandGithub,
  IconLink,
  IconCode,
} from "@tabler/icons-react";

interface ExportBarProps {
  image: DitherImage;
  imgRef: React.RefObject<HTMLImageElement | null>;
  settings: DitherSettings;
  className?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function settingsToParams(s: DitherSettings): URLSearchParams {
  const p = new URLSearchParams();
  p.set("m", s.ditherMode);
  p.set("c", s.colorMode);
  p.set("g", String(s.gridSize));
  p.set("p", s.pixelRatio.toString());
  p.set("t", s.threshold.toString());
  p.set("b", s.brightness.toString());
  p.set("k", s.contrast.toString());
  p.set("i", s.invert ? "1" : "0");
  p.set("a", s.animated ? "1" : "0");
  p.set("as", s.animationSpeed.toString());
  p.set("pc", s.primaryColor);
  p.set("sc", s.secondaryColor);
  p.set("f", s.objectFit);
  if (s.backgroundColor !== "transparent") p.set("bg", s.backgroundColor);
  if (s.colorMode === "custom") p.set("pal", s.customPalette.join("-"));
  return p;
}

function settingsFromParams(p: URLSearchParams): Partial<DitherSettings> {
  const s: Partial<DitherSettings> = {};
  const get = (k: string) => p.get(k);

  if (p.has("m")) s.ditherMode = get("m") as DitherSettings["ditherMode"];
  if (p.has("c")) s.colorMode = get("c") as DitherSettings["colorMode"];
  if (p.has("g")) s.gridSize = Number(get("g"));
  if (p.has("p")) s.pixelRatio = Number(get("p"));
  if (p.has("t")) s.threshold = Number(get("t"));
  if (p.has("b")) s.brightness = Number(get("b"));
  if (p.has("k")) s.contrast = Number(get("k"));
  if (p.has("i")) s.invert = get("i") === "1";
  if (p.has("a")) s.animated = get("a") === "1";
  if (p.has("as")) s.animationSpeed = Number(get("as"));
  if (p.has("pc")) s.primaryColor = get("pc") as string;
  if (p.has("sc")) s.secondaryColor = get("sc") as string;
  if (p.has("f")) s.objectFit = get("f") as DitherSettings["objectFit"];
  if (p.has("bg")) s.backgroundColor = get("bg") as string;
  if (p.has("pal")) {
    const pal = get("pal");
    if (pal) s.customPalette = pal.split("-").filter(Boolean);
  }

  return s;
}

export function settingsToShareUrl(settings: DitherSettings): string {
  if (typeof window === "undefined") return "";
  const params = settingsToParams(settings);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function settingsFromUrl(): Partial<DitherSettings> {
  if (typeof window === "undefined") return {};
  return settingsFromParams(new URLSearchParams(window.location.search));
}

export function buildEmbedCode(settings: DitherSettings): string {
  if (typeof window === "undefined") return "";
  const url = settingsToShareUrl(settings);
  return `<iframe src="${url}" width="720" height="540" style="border:0" allow="clipboard-write"></iframe>`;
}

export function ExportBar({
  image,
  imgRef,
  settings,
  className,
}: ExportBarProps) {
  const [downloading, setDownloading] = useState(false);
  const [exportSize, setExportSize] = useState<"source" | "1080" | "2400">(
    "source",
  );
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const exportDims = useMemo(() => {
    if (exportSize === "source") {
      return { w: image.width, h: image.height, label: `${image.width}×${image.height}` };
    }
    const target = Number(exportSize);
    const aspect = image.width / image.height;
    if (aspect >= 1) {
      return {
        w: Math.min(target, image.width),
        h: Math.round(Math.min(target, image.width) / aspect),
        label: `${Math.round(Math.min(target, image.width) / aspect)}p`,
      };
    }
    return {
      w: Math.round(Math.min(target, image.height) * aspect),
      h: Math.min(target, image.height),
      label: `${Math.min(target, image.height)}p`,
    };
  }, [image, exportSize]);

  const download = async () => {
    if (!imgRef.current) return;
    setDownloading(true);
    setExportError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = exportDims.w;
      canvas.height = exportDims.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No 2d context");
      renderDither(imgRef.current, canvas, settings, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not create blob");
      const baseName = image.name.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}-dither.png`);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  const copyText = async (text: string, kind: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setExportError("Could not copy. Your browser may block this.");
    }
  };

  const shareUrl = useMemo(() => settingsToShareUrl(settings), [settings]);
  const embedCode = useMemo(() => buildEmbedCode(settings), [settings]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={download}
          disabled={downloading}
          size="default"
        >
          <IconDownload className="size-4" />
          {downloading ? "Rendering…" : "Download PNG"}
        </Button>

        <div className="flex items-center gap-1 rounded-none border border-border bg-background p-0.5">
          {(["source", "1080", "2400"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setExportSize(size)}
              className={cn(
                "px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-all",
                exportSize === size
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {size === "source" ? "Source" : `${size}p`}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={() => setShareMenuOpen((v) => !v)}
        >
          <IconLink className="size-4" />
          Share
        </Button>
      </div>

      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
        <span>
          Export: <span className="text-foreground">{exportDims.label}</span>
        </span>
        <span>·</span>
        <span>
          {settings.colorMode === "duotone"
            ? "Duotone"
            : settings.colorMode === "custom"
              ? `${settings.customPalette.length}-color palette`
              : settings.colorMode}
        </span>
      </div>

      {shareMenuOpen && (
        <div className="flex flex-col gap-2 rounded-none border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <IconLink className="size-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              Share link
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 truncate border border-border bg-background px-2 py-1.5 font-mono text-[10px] text-foreground">
              {shareUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(shareUrl, "link")}
            >
              {copied === "link" ? (
                <IconCheck className="size-3.5 text-primary" />
              ) : (
                <IconCopy className="size-3.5" />
              )}
            </Button>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            The link encodes all settings. Open it to recreate the look.
          </p>

          <div className="mt-2 flex items-center gap-2">
            <IconCode className="size-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              Embed code
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 truncate border border-border bg-background px-2 py-1.5 font-mono text-[10px] text-foreground">
              {embedCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(embedCode, "embed")}
            >
              {copied === "embed" ? (
                <IconCheck className="size-3.5 text-primary" />
              ) : (
                <IconCopy className="size-3.5" />
              )}
            </Button>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Drop this iframe on any page to embed the dithered result.
          </p>
        </div>
      )}

      {exportError && (
        <p className="font-mono text-[10px] text-destructive">{exportError}</p>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Built by
          </span>
          <a
            href="https://fuego.im"
            className="font-sans text-sm font-bold text-foreground hover:text-primary"
          >
            Fuego
          </a>
        </div>
        <a
          href="https://github.com/fuegocoding"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary"
        >
          <IconBrandGithub className="size-3.5" />
          Source
        </a>
      </div>
    </footer>
  );
}
