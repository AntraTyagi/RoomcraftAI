<<<<<<< HEAD
import { useToast } from "../../hooks/use-toast"
=======
import { useToast } from "@/hooks/use-toast"
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
<<<<<<< HEAD
} from "./toast"
=======
} from "@/components/ui/toast"
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
