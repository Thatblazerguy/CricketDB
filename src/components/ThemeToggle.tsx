"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    const initialColorValue = root.classList.contains("dark") ? "dark" : "light";
    setTheme(initialColorValue);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "fixed top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all",
        "dark:bg-black/10 dark:border-white/10 dark:hover:bg-black/20"
      )}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-zinc-900" />
      ) : (
        <Sun className="w-5 h-5 text-zinc-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
