import type { IconTone } from "@directify/ui";

// Eagerly imported as real module assets (not `public/`) so Vite emits each
// SVG as a hashed file and rewrites every reference to a path relative to
// the built index.html. That's what makes icons work under Electron's
// `file://` window — a hardcoded root-absolute string like "/icons/x.svg"
// resolves against the filesystem drive root there, not the app folder.
const modules = import.meta.glob("./assets/icons/*/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const iconUrls = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  const match = path.match(/assets\/icons\/([^/]+)\/([^/]+)\.svg$/);
  if (match) iconUrls.set(`${match[1]}/${match[2]}`, url);
}

export function resolveDesktopIcon(name: string, tone: IconTone): string {
  const key = `${tone}/${name}`;
  const url = iconUrls.get(key);
  if (!url) {
    console.warn(`[directify] No bundled icon for "${key}" — check the name/tone are fetched.`);
    return "";
  }
  return url;
}
