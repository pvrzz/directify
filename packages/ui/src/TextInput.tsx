import type { InputHTMLAttributes } from "react";

export function TextInput({ style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        padding: "10px 12px",
        borderRadius: "var(--df-radius-sm)",
        border: "1px solid var(--df-border)",
        background: "var(--df-surface-2)",
        color: "var(--df-text)",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        ...style,
      }}
      {...rest}
    />
  );
}
