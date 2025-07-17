import type { ReactNode } from "react"
import { cn } from "@/lib/tailwindUtils"
import { Breadcrumb } from "@/components/common"
import { motion } from "framer-motion"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: Array<{ title: string; href: string }>
  className?: string
}

export const PageHeader = ({ title, description, actions, breadcrumbs, className }: PageHeaderProps) => {
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  return (
    <motion.div 
      className={cn("space-y-6 pb-8 lg:pb-10", className)}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {breadcrumbs && (
        <motion.div variants={itemVariants}>
          <Breadcrumb items={breadcrumbs} />
        </motion.div>
      )}
      
      <div className="flex flex-col gap-4 lg:gap-6 md:flex-row md:items-start md:justify-between">
        <motion.div className="space-y-3 lg:space-y-4 flex-1 min-w-0" variants={itemVariants}>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl xl:text-4xl leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </motion.div>
        
        {actions && (
          <motion.div 
            className="flex items-center gap-3 lg:gap-4 flex-shrink-0" 
            variants={itemVariants}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default PageHeader
