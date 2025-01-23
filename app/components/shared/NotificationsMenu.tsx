import type React from "react"
import { useMemo } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/app/providers/userContext"

interface NotificationsMenuProps {
  initialCount: number
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ initialCount }) => {
  const { toast } = useToast()
  const { user, loading: isLoading, error } = useUser();
  console.log(user);

  const displayCount = useMemo(() => {
    return (user?.credits ?? 0) > 99 ? '99+' : (user?.credits ?? 0).toString()
  }, [user?.credits])


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {Number(displayCount) > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
              >
                {displayCount}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
    
    </DropdownMenu>
  )
}

export default NotificationsMenu

