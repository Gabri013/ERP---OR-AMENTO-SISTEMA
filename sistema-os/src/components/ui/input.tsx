import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-none border-b-2 border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-none transition-all duration-200 placeholder:text-white/40 focus-visible:outline-none focus-visible:border-[#F7931A] focus-visible:ring-0 focus-visible:shadow-[0_10px_25px_-15px_rgba(247,147,26,0.35)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
