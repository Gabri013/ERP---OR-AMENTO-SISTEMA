import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white shadow-none placeholder:text-white/40 focus-visible:outline-none focus-visible:border-[#F7931A] focus-visible:ring-0 focus-visible:shadow-[0_10px_25px_-15px_rgba(247,147,26,0.35)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
