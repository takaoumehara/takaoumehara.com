import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Total Wireless Button Component
 *
 * Variants mapped from the Plans Listing Page Figma file:
 * - default (primary): Navy bg (#000330), white text, pill radius
 * - secondary: White bg, navy border + text
 * - cta: Red bg (#EE0000) — "Add to Cart" style buttons
 * - outline: Transparent with border
 * - ghost: No bg, hover shows muted
 * - link: Underline style
 * - teal: Teal accent for savings/promo actions
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-tw-navy-900 text-white hover:bg-tw-navy-700 active:bg-tw-navy-800",
        secondary:
          "border-tw-navy-900 bg-transparent text-tw-navy-900 hover:bg-[var(--tw-button-hover-muted)]",
        cta:
          "bg-tw-red-600 text-white hover:bg-tw-red-700 active:bg-tw-red-700",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-tw-navy-900 underline-offset-4 hover:underline",
        teal:
          "bg-tw-teal-400 text-tw-navy-900 hover:bg-tw-teal-500 active:bg-tw-teal-600",
        dark:
          "bg-tw-gray-900 text-white hover:bg-tw-gray-800 active:bg-tw-gray-700",
      },
      size: {
        default: "h-12 gap-2 px-6 text-base leading-6",
        xs: "h-7 gap-1 rounded-md px-3 text-xs",
        sm: "h-10 gap-1.5 px-4 text-sm",
        lg: "h-12 gap-2 px-8 text-base leading-6",
        xl: "h-14 gap-3 px-10 text-lg",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
        full: "h-12 w-full gap-2 px-6 text-base",
      },
      rounded: {
        default: "rounded-full",
        full: "rounded-full",
        md: "rounded-md",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  rounded = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, rounded, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
