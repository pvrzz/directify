// Applies the user's proxy choice to the app's network session (covers every net.fetch call: search, metadata, .osz and cover downloads).
import type { ProxyConfig } from "@directify/shared";
import { session } from "electron";

export function applyProxySettings(proxy: ProxyConfig): Promise<void> {
  if (proxy.type === "none" || !proxy.host) {
    return session.defaultSession.setProxy({ mode: "direct" });
  }

  const hostPort = proxy.port ? `${proxy.host}:${proxy.port}` : proxy.host;
  const proxyRules =
    proxy.type === "socks4" || proxy.type === "socks5"
      ? `${proxy.type}://${hostPort}`
      : `${proxy.type}=${hostPort}`;

  return session.defaultSession.setProxy({ proxyRules });
}
