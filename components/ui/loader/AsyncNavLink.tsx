'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface AsyncNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function AsyncNavLink({
  href,
  children,
  className,
  variant = 'default',
  size = 'default',
}: AsyncNavLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
    >
      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}
