import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

export function GlassCard({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass-card rounded-xl", className)} {...props} />;
}
