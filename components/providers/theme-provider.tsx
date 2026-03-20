"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Context = createContext<ThemeContext | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

function getInitialTheme(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme;
  return (localStorage.getItem("theme") as Theme | null) ?? defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(defaultTheme),
  );

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    const isDark =
      t === "dark" ||
      (t === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", isDark);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem("theme", t);
      applyTheme(t);
    },
    [applyTheme],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  return <Context value={{ theme, setTheme }}>{children}</Context>;
}

export function useTheme() {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
