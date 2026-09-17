import type { DirectifyIpcApi } from "../../ipc-types";

declare global {
  interface Window {
    directify: DirectifyIpcApi;
  }
}

export {};
