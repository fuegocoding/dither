"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  IconSun,
  IconMoon,
  IconBrandGithub,
  IconBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Toggle theme" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <IconSun className="size-5" />
      ) : (
        <IconMoon className="size-5" />
      )}
    </Button>
  );
}

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center border border-primary bg-primary text-primary-foreground">
            <IconBolt className="size-4" stroke={3} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans text-sm font-black tracking-tight">
              dither
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              by fuego
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a
              href="https://github.com/fuegocoding"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandGithub className="size-5" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
