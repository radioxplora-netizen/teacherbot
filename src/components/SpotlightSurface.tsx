import { PropsWithChildren, useMemo, useRef } from "react";

type Props = PropsWithChildren<{
  className?: string;
  as?: "div" | "section" | "header";
}>;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? true;
}

export default function SpotlightSurface({ children, className, as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const Comp = as as any;

  return (
    <Comp
      ref={ref}
      className={className}
      onMouseMove={(e: any) => {
        if (reduce) return;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--spot-x", `${x}%`);
        el.style.setProperty("--spot-y", `${y}%`);
      }}
    >
      {children}
    </Comp>
  );
}
