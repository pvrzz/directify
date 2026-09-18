// Custom titlebar buttons: Electron's native title bar (and even the Windows
// "Window Controls Overlay" API) always paints a flat, opaque rect behind
// itself, which can't blend into this app's gradient/glass backgrounds — so
// minimize/maximize/close are drawn here instead, themed to match.
import { useEffect, useState } from "react";

function WindowButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={
        {
          WebkitAppRegion: "no-drag",
          width: 46,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          color: "var(--df-text-muted)",
          cursor: "pointer",
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? "#e81123" : "var(--df-surface-3)";
        e.currentTarget.style.color = danger ? "#ffffff" : "var(--df-text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--df-text-muted)";
      }}
    >
      {children}
    </button>
  );
}

export function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.directify.isWindowMaximized().then(setMaximized);
    return window.directify.onWindowMaximizedChange(setMaximized);
  }, []);

  return (
    <div style={{ display: "flex", position: "fixed", top: 0, right: 0, zIndex: 100 }}>
      <WindowButton label="Minimize" onClick={() => window.directify.minimizeWindow()}>
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 5h10" stroke="currentColor" strokeWidth="1" />
        </svg>
      </WindowButton>
      <WindowButton
        label={maximized ? "Restore" : "Maximize"}
        onClick={() => window.directify.toggleMaximizeWindow()}
      >
        {maximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M2 0h8v8h-2M0 2h8v8H0z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </WindowButton>
      <WindowButton label="Close" danger onClick={() => window.directify.closeWindow()}>
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" />
        </svg>
      </WindowButton>
    </div>
  );
}
