import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.6)]",
        destructive:
          "bg-[#E05555] text-white shadow-[0_0_20px_-5px_rgba(224,85,85,0.5)] hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(224,85,85,0.6)]",
        outline:
          "border border-white/20 bg-transparent text-white hover:border-white hover:bg-white/10",
        secondary:
          "border border-[#F7931A]/20 bg-[#11151A] text-white hover:border-[#F7931A]/40 hover:bg-[#19202A]",
        ghost:
          "bg-transparent text-white hover:bg-white/10 hover:text-[#F7931A]",
        link:
          "text-[#F7931A] underline-offset-4 hover:underline hover:text-[#FFD600]",
      },
      size: {
        default: "min-h-11 px-5 py-3",
        sm: "min-h-9 rounded-full px-4 text-xs",
        lg: "min-h-12 rounded-full px-8 text-base",
        icon: "h-10 w-10 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
