// Button: pink (primary) is the app's own branded action, blue (accent) is reserved for download/get-the-app actions — matches osu!'s own site split between "Support" (pink) and "Download" (blue) rather than one hue for everything.
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "ghost";
  children: ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
  primary: {
    background: "var(--df-pink)",
    color: "var(--df-on-fill)",
    border: "none",
    boxShadow: "var(--df-shadow-sm)",
  },
  accent: {
    background: "var(--df-blue)",
    color: "var(--df-on-fill)",
    border: "none",
    boxShadow: "var(--df-shadow-sm)",
  },
  secondary: {
    background: "var(--df-surface-2)",
    color: "var(--df-text)",
    border: "1px solid var(--df-border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--df-text-muted)",
    border: "1px solid transparent",
  },
};

const hoverGlow: Partial<Record<NonNullable<ButtonProps["variant"]>, string>> = {
  primary: "var(--df-glow-pink)",
  accent: "var(--df-glow-blue)",
};

export function Button({ variant = "primary", style, disabled, children, ...rest }: ButtonProps) {
  return (
    <motion.button
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2, filter: "brightness(1.08)", boxShadow: hoverGlow[variant] }}
      whileTap={disabled ? undefined : { y: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{
        padding: "10px 20px",
        borderRadius: "var(--df-radius-sm)",
        fontWeight: 600,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        ...variantStyles[variant],
        ...style,
      }}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
