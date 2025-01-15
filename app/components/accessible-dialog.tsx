import { Dialog, DialogContent, DialogTitle, DialogContentProps } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface AccessibleDialogContentProps extends DialogContentProps {
  title: string
  hideTitle?: boolean
}

export function AccessibleDialogContent({ title, hideTitle = false, children, ...props }: AccessibleDialogContentProps) {
  return (
    <DialogContent {...props}>
      <DialogTitle>
        {hideTitle ? <VisuallyHidden>{title}</VisuallyHidden> : title}
      </DialogTitle>
      {children}
    </DialogContent>
  )
}

