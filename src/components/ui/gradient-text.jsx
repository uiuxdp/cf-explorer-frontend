"use client";
import React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

function GradientText({
  className,
  children,
  as: Component = "span",
  ...props
}) {
  const MotionComponent = motion.create(Component);

  return (
    (<MotionComponent
      className={cn("relative inline-flex overflow-hidden bg-white dark:bg-black", className)}
      {...props}>
      {children}
      <span
        className="pointer-events-none absolute inset-0 mix-blend-lighten dark:mix-blend-darken">
        <span
          className="pointer-events-none absolute -top-1/2 h-[30vw] w-[30vw] animate-[gradient-border_6s_ease-in-out_infinite,gradient-1_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-1))] mix-blend-overlay blur-[1rem]"></span>
        <span
          className="pointer-events-none absolute right-0 top-0 h-[30vw] w-[30vw] animate-[gradient-border_6s_ease-in-out_infinite,gradient-2_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-2))] mix-blend-overlay blur-[1rem]"></span>
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-[30vw] w-[30vw] animate-[gradient-border_6s_ease-in-out_infinite,gradient-3_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-3))] mix-blend-overlay blur-[1rem]"></span>
        <span
          className="pointer-events-none absolute -bottom-1/2 right-0 h-[30vw] w-[30vw] animate-[gradient-border_6s_ease-in-out_infinite,gradient-4_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-4))] mix-blend-overlay blur-[1rem]"></span>
      </span>
    </MotionComponent>)
  );
}


export { GradientText }