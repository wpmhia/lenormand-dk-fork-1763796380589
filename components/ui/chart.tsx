import { cn } from "@/lib/utils"

const ChartContainer = ({ 
  id, 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-chart={id}
    className={cn(
      "flex aspect-video justify-center text-xs",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const ChartTooltip = ({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border bg-popover px-3 py-1.5 text-sm shadow-md",
      className
    )}
    {...props}
  />
)

const ChartLegend = ({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-center gap-4 text-sm",
      className
    )}
    {...props}
  />
)

export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
}