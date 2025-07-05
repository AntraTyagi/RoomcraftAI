<<<<<<< HEAD
import { cn } from "../../lib/utils"
=======
import { cn } from "@/lib/utils"
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
