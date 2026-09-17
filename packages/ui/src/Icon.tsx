// Icon: resolves a name+tone to a URL via a swappable resolver. Default is a
// root-relative `/icons/<tone>/<name>.svg` path, correct for anything served
// over http(s) with its own public/ folder at the origin root (e.g. the
// Next.js site) — but wrong for a file:// window, where a root slash
// resolves against the filesystem drive root, not the app's own folder.
// Apps loaded via file:// (Electron's packaged build) override this with
// IconProvider and real bundled asset URLs; see
// apps/desktop/src/renderer/src/icon-map.ts for that resolver.
import { createContext, useContext, type ReactNode } from "react";

export type IconTone = "muted" | "pink" | "light" | "dark";

export interface IconProps {
  name: string;
  tone?: IconTone;
  size?: number;
  className?: string;
}

type IconResolver = (name: string, tone: IconTone) => string;

const defaultResolver: IconResolver = (name, tone) => `/icons/${tone}/${name}.svg`;

const IconResolverContext = createContext<IconResolver>(defaultResolver);

export function IconProvider({
  resolve,
  children,
}: {
  resolve: IconResolver;
  children: ReactNode;
}) {
  return (
    <IconResolverContext.Provider value={resolve}>{children}</IconResolverContext.Provider>
  );
}

export function Icon({ name, tone = "muted", size = 18, className }: IconProps) {
  const resolve = useContext(IconResolverContext);
  return (
    <img
      src={resolve(name, tone)}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      style={{ display: "block" }}
    />
  );
}
