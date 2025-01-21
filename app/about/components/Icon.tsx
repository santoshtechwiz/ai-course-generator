import { Clock, Smartphone, Users, Wallet } from "lucide-react"

interface IconProps {
  name: "clock" | "device" | "users" | "wallet"
  className?: string
}

export default function Icon({ name, className }: IconProps) {
  const icons = {
    clock: Clock,
    device: Smartphone,
    users: Users,
    wallet: Wallet,
  }

  const IconComponent = icons[name]

  return (
    <IconComponent
      className={`transition-all duration-300 ease-in-out hover:scale-110 hover:text-secondary ${className}`}
    />
  )
}

