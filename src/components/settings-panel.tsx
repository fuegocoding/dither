"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DitherSettings,
  DITHER_MODE_LABELS,
  COLOR_MODE_LABELS,
  PRESET_PALETTES,
  DitheringMode,
  ColorMode,
} from "@/lib/dither-types";
import {
  IconRefresh,
  IconWand,
  IconBolt,
  IconPalette,
  IconAdjustments,
  IconArrowsMove,
  IconPlayerPlay,
} from "@tabler/icons-react";

interface SettingsPanelProps {
  settings: DitherSettings;
  onChange: (settings: DitherSettings) => void;
  onReset: () => void;
  className?: string;
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-3 pl-5">{children}</div>
    </div>
  );
}

function ControlRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {value !== undefined && (
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ColorSwatch({
  color,
  onChange,
  size = "md",
}: {
  color: string;
  onChange: (color: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <label
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center overflow-hidden border border-border transition-all hover:border-primary",
        size === "md" ? "size-9" : "size-7",
      )}
      style={{ backgroundColor: color }}
      title={color}
    >
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function PaletteSwatch({
  colors,
  active,
  onClick,
  name,
}: {
  colors: string[];
  active: boolean;
  onClick: () => void;
  name: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/palette relative flex shrink-0 flex-col gap-1.5 border border-border bg-card p-2 text-left transition-all hover:border-primary",
        active && "border-primary ring-1 ring-primary/30",
      )}
      title={name}
    >
      <div className="flex h-5 w-16 overflow-hidden border border-border/50">
        {colors.map((c, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground group-hover/palette:text-foreground">
        {name}
      </span>
    </button>
  );
}

export function SettingsPanel({
  settings,
  onChange,
  onReset,
  className,
}: SettingsPanelProps) {
  const update = (patch: Partial<DitherSettings>) =>
    onChange({ ...settings, ...patch });

  const ditherModes: DitheringMode[] = ["bayer", "halftone", "noise", "crosshatch"];
  const colorModes: ColorMode[] = ["duotone", "grayscale", "custom", "original"];

  const isPaletteMode = settings.colorMode === "custom";
  const showDuotone = settings.colorMode === "duotone";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconWand className="size-4 text-primary" />
          <h2 className="font-sans text-sm font-bold tracking-tight">Settings</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <IconRefresh className="size-3.5" />
          Reset
        </Button>
      </div>

      <Section title="Pattern" icon={IconBolt}>
        <ControlRow label="Dither mode">
          <div className="grid grid-cols-2 gap-1.5">
            {ditherModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update({ ditherMode: mode })}
                className={cn(
                  "flex items-center justify-center border px-2 py-2 text-xs font-medium transition-all",
                  settings.ditherMode === mode
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {DITHER_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </ControlRow>

        <ControlRow
          label="Pixel size"
          value={`${Math.max(1, Math.floor((settings.gridSize ?? 2) * (settings.pixelRatio ?? 1)))}px`}
        >
          <Slider
            value={[settings.gridSize ?? 2]}
            min={1}
            max={10}
            step={1}
            onValueChange={([v]) => update({ gridSize: v })}
          />
        </ControlRow>

        <ControlRow
          label="Threshold"
          value={(settings.threshold ?? 0).toFixed(2)}
        >
          <Slider
            value={[settings.threshold ?? 0]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => update({ threshold: v })}
          />
        </ControlRow>
      </Section>

      <Separator />

      <Section title="Color" icon={IconPalette}>
        <ControlRow label="Color mode">
          <div className="grid grid-cols-4 gap-1.5">
            {colorModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update({ colorMode: mode })}
                className={cn(
                  "flex items-center justify-center border px-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-all",
                  settings.colorMode === mode
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {COLOR_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </ControlRow>

        {showDuotone && (
          <div className="flex flex-col gap-2 rounded-none border border-border bg-muted/30 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">
              Duotone
            </span>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <ColorSwatch
                  color={settings.primaryColor}
                  onChange={(c) => update({ primaryColor: c })}
                />
                <span className="font-mono text-[9px] text-muted-foreground">
                  DARK
                </span>
              </div>
              <div className="flex-1 border-t border-dashed border-border" />
              <div className="flex flex-col items-center gap-1">
                <ColorSwatch
                  color={settings.secondaryColor}
                  onChange={(c) => update({ secondaryColor: c })}
                />
                <span className="font-mono text-[9px] text-muted-foreground">
                  LIGHT
                </span>
              </div>
            </div>
          </div>
        )}

        {isPaletteMode && (
          <div className="flex flex-col gap-3 rounded-none border border-border bg-muted/30 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">
              Palette
            </span>
            <div className="flex flex-wrap gap-1.5">
              {settings.customPalette.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <ColorSwatch
                    color={c}
                    onChange={(color) => {
                      const next = [...settings.customPalette];
                      next[i] = color;
                      update({ customPalette: next });
                    }}
                    size="sm"
                  />
                  {settings.customPalette.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          customPalette: settings.customPalette.filter(
                            (_, j) => j !== i,
                          ),
                        })
                      }
                      className="font-mono text-[9px] text-muted-foreground hover:text-destructive"
                      title="Remove color"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {settings.customPalette.length < 8 && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      customPalette: [...settings.customPalette, "#888888"],
                    })
                  }
                  className="flex size-7 items-center justify-center border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                  title="Add color"
                >
                  +
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_PALETTES.map((preset) => (
                <PaletteSwatch
                  key={preset.name}
                  colors={preset.colors}
                  name={preset.name}
                  active={
                    preset.colors.length === settings.customPalette.length &&
                    preset.colors.every(
                      (c, i) =>
                        c.toLowerCase() ===
                        (settings.customPalette[i] || "").toLowerCase(),
                    )
                  }
                  onClick={() => update({ customPalette: preset.colors })}
                />
              ))}
            </div>
          </div>
        )}

        <ControlRow label="Invert">
          <div className="flex items-center justify-between rounded-none border border-border bg-background px-3 py-2">
            <span className="text-xs text-muted-foreground">Swap colors</span>
            <Switch
              checked={settings.invert}
              onCheckedChange={(v) => update({ invert: v })}
            />
          </div>
        </ControlRow>

        <ControlRow label="Background">
          <div className="flex items-center gap-2">
            <ColorSwatch
              color={
                settings.backgroundColor === "transparent"
                  ? "#ffffff"
                  : settings.backgroundColor
              }
              onChange={(c) => update({ backgroundColor: c })}
              size="sm"
            />
            <button
              type="button"
              onClick={() => update({ backgroundColor: "transparent" })}
              className={cn(
                "flex h-7 items-center gap-1.5 border px-2 text-[10px] font-medium uppercase tracking-wider transition-all",
                settings.backgroundColor === "transparent"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50",
              )}
            >
              <span className="checkered-bg size-3 border border-border" />
              None
            </button>
          </div>
        </ControlRow>
      </Section>

      <Separator />

      <Section title="Adjust" icon={IconAdjustments}>
        <ControlRow
          label="Brightness"
          value={
            (settings.brightness ?? 0) === 0
              ? "0"
              : `${(settings.brightness ?? 0) > 0 ? "+" : ""}${(settings.brightness ?? 0).toFixed(2)}`
          }
        >
          <Slider
            value={[settings.brightness ?? 0]}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={([v]) => update({ brightness: v })}
          />
        </ControlRow>

        <ControlRow
          label="Contrast"
          value={(settings.contrast ?? 1).toFixed(2)}
        >
          <Slider
            value={[settings.contrast ?? 1]}
            min={0}
            max={2}
            step={0.01}
            onValueChange={([v]) => update({ contrast: v })}
          />
        </ControlRow>
      </Section>

      <Separator />

      <Section title="Layout" icon={IconArrowsMove}>
        <ControlRow label="Fit">
          <Select
            value={settings.objectFit}
            onValueChange={(v) =>
              update({ objectFit: v as DitherSettings["objectFit"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="fill">Fill</SelectItem>
            </SelectContent>
          </Select>
        </ControlRow>
      </Section>

      <Separator />

      <Section title="Animation" icon={IconPlayerPlay}>
        <ControlRow label="Animated">
          <div className="flex items-center justify-between rounded-none border border-border bg-background px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {settings.animated ? "Live" : "Static"}
            </span>
            <Switch
              checked={settings.animated}
              onCheckedChange={(v) => update({ animated: v })}
            />
          </div>
        </ControlRow>
        {settings.animated && (
          <ControlRow
            label="Speed"
            value={(settings.animationSpeed ?? 0.02).toFixed(3)}
          >
          <Slider
            value={[settings.animationSpeed ?? 0.02]}
            min={0.005}
            max={0.1}
              step={0.005}
              onValueChange={([v]) => update({ animationSpeed: v })}
            />
          </ControlRow>
        )}
        {!settings.animated && settings.ditherMode !== "noise" && (
          <p className="text-[10px] text-muted-foreground">
            Tip: switch to <Badge variant="secondary" className="text-[9px] h-4">noise</Badge>{" "}
            and enable animation for a TV-static feel.
          </p>
        )}
      </Section>
    </div>
  );
}
