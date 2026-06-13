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
  siteTheme?: "light" | "dark" | null;
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

function getLuminanceFromHex(color: string): number {
  const hex = color.startsWith("#") ? color.slice(1) : color;
  const r =
    hex.length === 3
      ? parseInt(hex[0] + hex[0], 16)
      : parseInt(hex.slice(0, 2), 16);
  const g =
    hex.length === 3
      ? parseInt(hex[1] + hex[1], 16)
      : parseInt(hex.slice(2, 4), 16);
  const b =
    hex.length === 3
      ? parseInt(hex[2] + hex[2], 16)
      : parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function duotoneVariantSettings(
  settings: DitherSettings,
  variant: "light" | "dark",
): DitherSettings {
  const lightBg = "#ffffff";
  const darkBg = "#000000";
  const primaryLum = getLuminanceFromHex(settings.primaryColor);
  const secondaryLum = getLuminanceFromHex(settings.secondaryColor);
  const dark = primaryLum <= secondaryLum ? settings.primaryColor : settings.secondaryColor;
  const light = primaryLum <= secondaryLum ? settings.secondaryColor : settings.primaryColor;
  return {
    ...settings,
    primaryColor: dark,
    secondaryColor: light,
    backgroundColor: variant === "light" ? lightBg : darkBg,
  };
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
  const get = (k: string) => p.get(k);
  const num = (k: string) => {
    const v = get(k);
    if (v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const out: Partial<DitherSettings> = {};
  const m = get("m");
  if (m) out.ditherMode = m as DitherSettings["ditherMode"];
  const c = get("c");
  if (c) out.colorMode = c as DitherSettings["colorMode"];
  const g = num("g");
  if (g !== undefined) out.gridSize = g;
  const p2 = num("p");
  if (p2 !== undefined) out.pixelRatio = p2;
  const t = num("t");
  if (t !== undefined) out.threshold = t;
  const b = num("b");
  if (b !== undefined) out.brightness = b;
  const k = num("k");
  if (k !== undefined) out.contrast = k;
  if (get("i") === "1") out.invert = true;
  if (get("a") === "1") out.animated = true;
  const as = num("as");
  if (as !== undefined) out.animationSpeed = as;
  const pc = get("pc");
  if (pc) out.primaryColor = pc;
  const sc = get("sc");
  if (sc) out.secondaryColor = sc;
  const f = get("f");
  if (f) out.objectFit = f as DitherSettings["objectFit"];
  const bg = get("bg");
  if (bg) out.backgroundColor = bg;
  const pal = get("pal");
  if (pal) out.customPalette = pal.split("-").filter(Boolean);
  return out;
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
  siteTheme,
  className,
}: ExportBarProps) {
  const [downloading, setDownloading] = useState(false);
  const [exportSize, setExportSize] = useState<"source" | "1080" | "2400">(
    "source",
  );
  const [exportMode, setExportMode] = useState<"single" | "dual">("single");
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const isDuotone = settings.colorMode === "duotone";
  const effectiveExportMode: "single" | "dual" =
    isDuotone && exportMode === "dual" ? "dual" : "single";

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
      const baseName = image.name.replace(/\.[^.]+$/, "");
      const singleSettings =
        isDuotone && siteTheme ? duotoneVariantSettings(settings, siteTheme) : settings;
      const variants: { suffix: string; settings: DitherSettings }[] =
        effectiveExportMode === "dual" && isDuotone
          ? [
              { suffix: "light", settings: duotoneVariantSettings(settings, "light") },
              { suffix: "dark", settings: duotoneVariantSettings(settings, "dark") },
            ]
          : [{ suffix: "", settings: singleSettings }];

      for (const v of variants) {
        const canvas = document.createElement("canvas");
        canvas.width = exportDims.w;
        canvas.height = exportDims.h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No 2d context");
        renderDither(imgRef.current, canvas, v.settings, 0);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) throw new Error("Could not create blob");
        const filename = v.suffix
          ? `${baseName}-dither-${v.suffix}.png`
          : `${baseName}-dither.png`;
        downloadBlob(blob, filename);
      }
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

        {isDuotone && (
          <div className="flex items-center gap-1 rounded-none border border-border bg-background p-0.5">
            {(["single", "dual"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setExportMode(mode)}
                className={cn(
                  "px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-all",
                  exportMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "single" ? "Single" : "Light + Dark"}
              </button>
            ))}
          </div>
        )}

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
          {effectiveExportMode === "dual" && isDuotone
            ? "Light + Dark"
            : settings.colorMode === "duotone"
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
