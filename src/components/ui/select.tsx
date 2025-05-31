import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

// Composants de compatibilité pour l'API Radix UI
const SelectValue = ({ placeholder }: { placeholder?: string }) => null
const SelectTrigger = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props}>
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </div>
)
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectItem = ({ children, value, ...props }: { children: React.ReactNode; value: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <option value={value}>{children}</option>
)

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} 