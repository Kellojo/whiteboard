import type { IconifyIcon } from "@iconify/types";

export interface IconBrowserItem {
  id: string;
  label: string;
}

const lucideIconModules = import.meta.glob(
  "../../../../node_modules/@iconify-icons/lucide/*.js",
);
const lucideIconModuleLoaders = lucideIconModules as Record<
  string,
  () => Promise<{ default: IconifyIcon }>
>;

function toLabel(iconId: string): string {
  return iconId
    .split("-")
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function parseIconId(path: string): string | null {
  const fileName = path.split("/").pop();
  if (!fileName || !fileName.endsWith(".js")) {
    return null;
  }

  const iconId = fileName.slice(0, -3);
  if (!iconId || iconId === "index") {
    return null;
  }

  return iconId;
}

function buildIconBrowserItems(): IconBrowserItem[] {
  const items: IconBrowserItem[] = [];

  for (const path of Object.keys(lucideIconModuleLoaders)) {
    const iconId = parseIconId(path);
    if (!iconId) {
      continue;
    }

    items.push({
      id: iconId,
      label: toLabel(iconId),
    });
  }

  items.sort((left, right) => left.label.localeCompare(right.label));
  return items;
}

export const ICON_BROWSER_ITEMS: IconBrowserItem[] = buildIconBrowserItems();
const iconModulePathById = new Map<string, string>();
for (const path of Object.keys(lucideIconModuleLoaders)) {
  const iconId = parseIconId(path);
  if (!iconId) {
    continue;
  }
  iconModulePathById.set(iconId, path);
}
const iconDataCache = new Map<string, IconifyIcon>();

export const ICON_DROP_MIME = "application/x-whiteboard-icon";
export const ICON_DROP_TEXT_PREFIX = "whiteboard-icon:";

function resolveModulePath(iconId: string): string | null {
  return iconModulePathById.get(iconId) ?? null;
}

export async function loadIconData(
  iconId: string,
): Promise<IconifyIcon | null> {
  const cached = iconDataCache.get(iconId);
  if (cached) {
    return cached;
  }

  const modulePath = resolveModulePath(iconId);
  if (!modulePath) {
    return null;
  }

  const loader = lucideIconModuleLoaders[modulePath];
  if (!loader) {
    return null;
  }

  const moduleValue = await loader();
  const icon = moduleValue?.default;
  if (!icon) {
    return null;
  }

  iconDataCache.set(iconId, icon);
  return icon;
}

export async function createIconSvgData(iconId: string): Promise<{
  dataUrl: string;
  width: number;
  height: number;
} | null> {
  const icon = await loadIconData(iconId);
  if (!icon) {
    return null;
  }

  const raw = icon as {
    body?: string;
    width?: number;
    height?: number;
  };
  const body = raw.body ?? "";
  if (!body) {
    return null;
  }

  const width = raw.width ?? 24;
  const height = raw.height ?? 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return {
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width,
    height,
  };
}
