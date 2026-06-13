"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface DropzoneProps {
  onFile: (file: File) => void;
  compact?: boolean;
  className?: string;
  onSample?: () => void;
}

const SAMPLE_IMAGE = "/sample.jpg";

export function Dropzone({
  onFile,
  compact = false,
  className,
  onSample,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please drop an image file");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Image must be under 20MB");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  if (compact) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <IconUpload className="size-4" />
            Replace image
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSample}
            className="text-muted-foreground"
          >
            Try a sample
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed bg-muted/60 px-6 py-16 text-center transition-all backdrop-blur-sm",
        isOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/70",
        error && "border-destructive/50",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-background">
        <IconUpload className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="font-sans text-lg font-bold text-foreground">
          {isOver ? "Drop it like it's hot" : "Drop an image to dither"}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground uppercase tracking-[0.15em]">
          PNG · JPG · WebP · max 20MB
        </p>
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <IconPhoto className="size-4" />
          Choose file
        </Button>
        {onSample && (
          <Button variant="ghost" size="sm" onClick={onSample}>
            Try a sample
          </Button>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-destructive">
          <IconX className="size-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

export { SAMPLE_IMAGE };
