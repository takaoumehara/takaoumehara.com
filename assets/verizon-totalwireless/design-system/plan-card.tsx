import { cn } from "@/lib/utils"

/**
 * Total Wireless Plan Card Component
 *
 * A specialized card for displaying wireless plan options.
 * Includes Figma-aligned plan surface, selected navy border,
 * and plan-specific typography.
 *
 * Usage:
 * <PlanCard selected>
 *   <PlanCardBanner>
 *     <PlanCardHeader>
 *       <PlanCardTitle>Total 5G Unlimited</PlanCardTitle>
 *       <PlanCardBadge>Best value</PlanCardBadge>
 *     </PlanCardHeader>
 *     <PlanCardPrice price="$50" suffix="/line per month" />
 *   </PlanCardBanner>
 *   <PlanCardFeatures features={["Unlimited 5G data", "15 GB Hotspot"]} />
 *   <PlanCardAction>Add to Cart</PlanCardAction>
 * </PlanCard>
 */

interface PlanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean
}

function PlanCard({ className, selected, children, ...props }: PlanCardProps) {
  return (
    <div
      data-slot="plan-card"
      data-selected={selected ? "" : undefined}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-[var(--bg-card-plan)] p-5 transition-all",
        "shadow-[var(--shadow-card)]",
        selected
          ? "border-tw-navy-900 shadow-[0_0_0_3px_rgba(0,3,48,0.14),var(--shadow-md)]"
          : "border-tw-gray-300 hover:border-tw-navy-300 hover:shadow-[var(--shadow-card-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Full-bleed teal banner that sits at the top of the card. Recreates the
 * Total Wireless plan-header ripple (public/branding/plan-ripple.svg) and is
 * meant to wrap the plan title, badge, and price.
 */
function PlanCardBanner({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="plan-card-banner"
      className={cn(
        "-mx-5 -mt-5 mb-5 px-5 pt-5 pb-4",
        "bg-tw-teal-400 bg-[url('/branding/plan-ripple.svg')] bg-cover bg-right bg-no-repeat",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function PlanCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="plan-card-header"
      className={cn("flex items-center justify-between mb-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function PlanCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="plan-card-title"
      className={cn(
        "text-base font-bold text-tw-navy-900 tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

function PlanCardBadge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="plan-card-badge"
      className={cn(
        "inline-flex items-center rounded-lg bg-tw-red-600 px-2.5 py-0.5 text-xs font-bold text-white",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

interface PlanCardPriceProps extends React.HTMLAttributes<HTMLDivElement> {
  price: string
  suffix?: string
  note?: string
}

function PlanCardPrice({
  className,
  price,
  suffix = "/line per month",
  note,
  ...props
}: PlanCardPriceProps) {
  return (
    <div data-slot="plan-card-price" className={cn("mb-4", className)} {...props}>
      <div className="flex items-baseline gap-1">
          <span className="text-5xl font-extrabold text-tw-navy-900 leading-tight tracking-tight">
          {price}
        </span>
        <span className="text-lg font-normal text-tw-navy-900/70">{suffix}</span>
      </div>
      {note && (
        <p className="mt-1 text-sm text-tw-navy-900/70">
          {note}
        </p>
      )}
    </div>
  )
}

interface PlanCardSpecsProps extends React.HTMLAttributes<HTMLDivElement> {
  specs: { label: string; value: string }[]
}

function PlanCardSpecs({ className, specs, ...props }: PlanCardSpecsProps) {
  return (
    <div
      data-slot="plan-card-specs"
      className={cn(
        "grid grid-cols-3 gap-4 py-3 border-t border-b border-tw-gray-200 mb-4",
        className
      )}
      {...props}
    >
      {specs.map((spec) => (
        <div key={spec.label} className="text-center">
          <div className="text-xs text-tw-gray-500 mb-0.5">{spec.label}</div>
          <div className="text-sm font-bold text-tw-navy-900">{spec.value}</div>
        </div>
      ))}
    </div>
  )
}

interface PlanCardFeaturesProps extends React.HTMLAttributes<HTMLUListElement> {
  features: string[]
}

function PlanCardFeatures({
  className,
  features,
  ...props
}: PlanCardFeaturesProps) {
  return (
    <ul
      data-slot="plan-card-features"
      className={cn("flex flex-col gap-2 list-none p-0 mb-6", className)}
      {...props}
    >
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-start gap-2 text-sm text-tw-gray-600 leading-normal"
        >
          <span className="text-tw-teal-400 font-bold flex-shrink-0">•</span>
          {feature}
        </li>
      ))}
    </ul>
  )
}

function PlanCardAction({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="plan-card-action"
      className={cn("mt-auto pt-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  PlanCard,
  PlanCardBanner,
  PlanCardHeader,
  PlanCardTitle,
  PlanCardBadge,
  PlanCardPrice,
  PlanCardSpecs,
  PlanCardFeatures,
  PlanCardAction,
}
