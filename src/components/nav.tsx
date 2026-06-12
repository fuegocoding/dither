"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  IconSun,
  IconMoon,
  IconBrandGithub,
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
        <Link
          href="https://fuego.im"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5"
        >
          <img
            alt="Fuego"
            className="size-8 rounded-full border border-border"
            src="https://avatars.githubusercontent.com/u/138329152?v=4"
          />
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
              href="https://github.com/fuegocoding/dither"
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
