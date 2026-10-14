"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef } from "react";

const MAX_SHIFT = 16;

export function TeraMark({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduceMotion) return;

    function onMouseMove(event: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const range = Math.max(rect.width * 3, 240);
      const nx = Math.max(-1, Math.min(1, (event.clientX - centerX) / range));
      const ny = Math.max(-1, Math.min(1, (event.clientY - centerY) / range));
      x.set(nx * MAX_SHIFT);
      y.set(ny * MAX_SHIFT);
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [reduceMotion, x, y]);

  const eyes = (
    <>
      <path
        d="M70 100c9-19 27-19 36-1"
        stroke="#0a0a0a"
        strokeWidth="12"
        strokeLinecap="round"
        transform="rotate(-10 88 94)"
      />
      <path
        d="M134 99c9-18 27-18 36 1"
        stroke="#0a0a0a"
        strokeWidth="12"
        strokeLinecap="round"
        transform="rotate(10 152 94)"
      />
    </>
  );

  return (
    <svg
      ref={ref}
      viewBox="0 0 240 240"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="120" cy="120" r="120" fill="white" />
      <motion.g style={{ x: springX, y: springY }}>
        {reduceMotion ? (
          eyes
        ) : (
          <motion.g
            style={{
              transformBox: "view-box",
              transformOrigin: "120px 100px",
            }}
            animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
            transition={{
              duration: 4,
              times: [0, 0.9, 0.945, 0.97, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {eyes}
          </motion.g>
        )}
      </motion.g>
    </svg>
  );
}
