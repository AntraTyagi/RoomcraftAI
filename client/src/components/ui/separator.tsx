import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

<<<<<<< HEAD
import { cn } from "../../lib/utils"
=======
import { cn } from "@/lib/utils"
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
