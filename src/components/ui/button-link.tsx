import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
};

const variants = {
  primary:
    "bg-brand text-white hover:bg-brand-hover focus-visible:outline-brand",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-surface focus-visible:outline-brand",
};

export function ButtonLink({
  className = "",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

