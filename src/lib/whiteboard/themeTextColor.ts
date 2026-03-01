type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

let probeContext: CanvasRenderingContext2D | null | undefined;
let cachedThemeKey = "";
let cachedCanvasBg = "#ffffff";
let cachedAppText = "#111827";
let themeAwareTextColorEnabled = true;

export function setThemeAwareTextColorEnabled(enabled: boolean): void {
  themeAwareTextColorEnabled = enabled;
}

export function isThemeAwareTextColorEnabled(): boolean {
  return themeAwareTextColorEnabled;
}

export function resolveThemeAwareTextColor(
  textColor: string,
  fillColor: string,
): string {
  if (!themeAwareTextColorEnabled) {
    return textColor;
  }

  if (!isTransparent(fillColor)) {
    return textColor;
  }

  const { canvasBg, appText } = getThemeColors();
  const contrastWithCanvas = getContrastRatio(textColor, canvasBg);
  if (contrastWithCanvas >= 3) {
    return textColor;
  }

  const appTextContrast = getContrastRatio(appText, canvasBg);
  return appTextContrast > contrastWithCanvas ? appText : textColor;
}

function isTransparent(color: string): boolean {
  const normalized = color.trim().toLowerCase();
  return (
    normalized === "transparent" ||
    normalized === "rgba(0, 0, 0, 0)" ||
    normalized === "rgba(0,0,0,0)"
  );
}

function getThemeColors(): { canvasBg: string; appText: string } {
  if (typeof document === "undefined") {
    return { canvasBg: cachedCanvasBg, appText: cachedAppText };
  }

  const root = document.documentElement;
  const key = root.getAttribute("data-theme") ?? "dark";
  if (key !== cachedThemeKey) {
    const styles = getComputedStyle(root);
    cachedCanvasBg = styles.getPropertyValue("--canvas-bg").trim() || "#ffffff";
    cachedAppText = styles.getPropertyValue("--app-text").trim() || "#111827";
    cachedThemeKey = key;
  }

  return { canvasBg: cachedCanvasBg, appText: cachedAppText };
}

function getProbeContext(): CanvasRenderingContext2D | null {
  if (probeContext !== undefined) {
    return probeContext;
  }

  if (typeof document === "undefined") {
    probeContext = null;
    return probeContext;
  }

  probeContext = document.createElement("canvas").getContext("2d");
  return probeContext;
}

function resolveToRgba(color: string): RGBA | null {
  const context = getProbeContext();
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "#000000";
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);

  const pixel = context.getImageData(0, 0, 1, 1).data;
  return {
    r: pixel[0] ?? 0,
    g: pixel[1] ?? 0,
    b: pixel[2] ?? 0,
    a: (pixel[3] ?? 255) / 255,
  };
}

function getContrastRatio(foreground: string, background: string): number {
  const fg = resolveToRgba(foreground);
  const bg = resolveToRgba(background);
  if (!fg || !bg) {
    return 21;
  }

  const effectiveFg = fg.a < 1 ? blend(fg, bg) : fg;
  const fgLuminance = relativeLuminance(effectiveFg);
  const bgLuminance = relativeLuminance(bg);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground: RGBA, background: RGBA): RGBA {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha <= 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r:
      (foreground.r * foreground.a +
        background.r * background.a * (1 - foreground.a)) /
      alpha,
    g:
      (foreground.g * foreground.a +
        background.g * background.a * (1 - foreground.a)) /
      alpha,
    b:
      (foreground.b * foreground.a +
        background.b * background.a * (1 - foreground.a)) /
      alpha,
    a: alpha,
  };
}

function relativeLuminance(color: RGBA): number {
  const r = toLinear(color.r / 255);
  const g = toLinear(color.g / 255);
  const b = toLinear(color.b / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return ((value + 0.055) / 1.055) ** 2.4;
}
