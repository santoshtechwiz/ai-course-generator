// 'use client'

// import * as React from 'react'
// import Link from 'next/link'
// import { usePathname, useRouter } from 'next/navigation'
// import { LayoutDashboard, BookOpen, PlusCircle, HelpCircle, Code2, User, Settings, LogOut, GraduationCap, ChevronLeft, ChevronRight, Search } from 'lucide-react'
// import { cn } from '@/lib/utils'
// import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar'
// import { signOut } from 'next-auth/react'

// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'

// const menuItems = [
//   {
//     title: 'Main',
//     items: [
//       {
//         label: 'Dashboard',
//         icon: <LayoutDashboard size={20} />,
//         href: '/dashboard',
//       },
//       {
//         label: 'My Courses',
//         icon: <BookOpen size={20} />,
//         href: '/dashboard/courses',
//       },
//     ],
//   },
//   {
//     title: 'Create',
//     items: [
//       {
//         label: 'Create Course',
//         icon: <PlusCircle size={20} />,
//         href: '/dashboard/create',
//       },
//       {
//         label: 'Create Quiz',
//         icon: <GraduationCap size={20} />,
//         href: '/dashboard/quiz',
//       },
//       {
//         label: 'Opend Quiz',
//         icon: <GraduationCap size={20} />,
//         href: '/dashboard/openended',
//       },
//     ],
//   },
//   {
//     title: 'Tools',
//     items: [
//       {
//         label: 'Code',
//         icon: <Code2 size={20} />,
//         href: '/dashboard/code',
//       },
//     ],
//   },
//   {
//     title: 'Account',
//     items: [
//       {
//         label: 'Profile',
//         icon: <User size={20} />,
//         href: '/dashboard/profile',
//       },
//       {
//         label: 'Admin',
//         icon: <Settings size={20} />,
//         href: '/admin',
//       },
//     ],
//   },
// ]

// export default function CourseSidebar({isOpen}: {isOpen: boolean}) {
//   const pathname = usePathname()
//   const router = useRouter()
//   const [collapsed, setCollapsed] = React.useState(false)
//   const [searchTerm, setSearchTerm] = React.useState('')

//   const toggleSidebar = () => {
//     setCollapsed(!collapsed)
//   }

//   const handleMenuItemClick = (href: string) => {
//     router.push(href)
//     // Close sidebar on mobile when menu item is clicked
//     if (window.innerWidth < 1024) {
//       setCollapsed(true)
//     }
//   }

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault()
//     // Implement search functionality here
//     console.log('Searching for:', searchTerm)
//   }

//   return (
//     <div className='mt-50'>
//       {/* Mobile Overlay */}
//       {!collapsed && (
//         <div 
//           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" 
//           onClick={toggleSidebar}
//         ></div>
//       )}

//       <Sidebar
//         collapsed={collapsed}
//         width={collapsed ? "80px" : "250px"}
//         collapsedWidth="80px"
//         className={cn(
//           "border-r fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out bg-background",
//           collapsed ? "w-20" : "w-64"
//         )}
//       >
//         <div className="flex items-center justify-between h-14 border-b px-4">
//           <Link 
//             href="/dashboard" 
//             className={cn(
//               "flex items-center gap-2 font-semibold",
//               collapsed ? "justify-center" : "px-2"
//             )}
//           >
//             {collapsed ? "C" : "Courses"}
//           </Link>
//           <button 
//             onClick={toggleSidebar} 
//             className="p-1 rounded-md hover:bg-accent transition-colors duration-200"
//           >
//             {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
//           </button>
//         </div>

//         {/* Search Section */}
//         <div className={cn(
//           "p-4 border-b",
//           collapsed ? "flex justify-center" : ""
//         )}>
//           {collapsed ? (
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-9 w-9"
//               onClick={() => setCollapsed(false)}
//             >
//               <Search className="h-4 w-4" />
//               <span className="sr-only">Search courses</span>
//             </Button>
//           ) : (
//             <form onSubmit={handleSearch} className="flex gap-2">
//               <div className="relative flex-1">
//                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   type="search"
//                   placeholder="Search courses..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-8 h-9"
//                 />
//               </div>
//               <Button type="submit" size="sm" className="h-9">
//                 Search
//               </Button>
//             </form>
//           )}
//         </div>

//         <Menu>
//           {menuItems.map((section, index) => (
//             <React.Fragment key={section.title}>
//               {!collapsed && (
//                 <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
//                   {section.title}
//                 </div>
//               )}
//               {section.items.map((item) => (
//                 <MenuItem
//                   key={item.href}
//                   icon={item.icon}
//                   onClick={() => handleMenuItemClick(item.href)}
//                   active={pathname === item.href}
//                   className={cn(
//                     "transition-colors duration-200",
//                     pathname === item.href ? "bg-accent" : "hover:bg-accent"
//                   )}
//                 >
//                   {item.label}
//                 </MenuItem>
//               ))}
//               {index < menuItems.length - 1 && (
//                 <div className="my-2 border-t border-border" />
//               )}
//             </React.Fragment>
//           ))}
//         </Menu>

//         <div className="absolute bottom-0 left-0 right-0 border-t p-4">
//           <Menu>
//             <MenuItem
//               icon={<LogOut size={20} />}
//               onClick={() => signOut()}
//               className="hover:bg-accent transition-colors duration-200"
//             >
//               Sign Out
//             </MenuItem>
//             <MenuItem
//               icon={<HelpCircle size={20} />}
//               onClick={() => handleMenuItemClick('/help')}
//               className="hover:bg-accent transition-colors duration-200"
//             >
//               Help & Support
//             </MenuItem>
//           </Menu>
//         </div>
//       </Sidebar>
//     </div>
//   )
// }

'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, BookOpen, PlusCircle, HelpCircle, Code2, User, Settings, LogOut, GraduationCap, Search } from 'lucide-react'
import { signOut } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        href: '/dashboard',
      },
      {
        label: 'My Courses',
        icon: <BookOpen className="h-4 w-4" />,
        href: '/dashboard/courses',
      },
    ],
  },
  {
    title: 'Create',
    items: [
      {
        label: 'Create Course',
        icon: <PlusCircle className="h-4 w-4" />,
        href: '/dashboard/create',
      },
      {
        label: 'Create Quiz',
        icon: <GraduationCap className="h-4 w-4" />,
        href: '/dashboard/quiz',
      },
      {
        label: 'Open Quiz',
        icon: <GraduationCap className="h-4 w-4" />,
        href: '/dashboard/openended',
      },
    ],
  },
  {
    title: 'Tools',
    items: [
      {
        label: 'Code',
        icon: <Code2 className="h-4 w-4" />,
        href: '/dashboard/code',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Profile',
        icon: <User className="h-4 w-4" />,
        href: '/dashboard/profile',
      },
      {
        label: 'Admin',
        icon: <Settings className="h-4 w-4" />,
        href: '/admin',
      },
    ],
  },
]

export default function CourseSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchTerm)
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between px-4 py-2">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              Courses
            </Link>
            <SidebarTrigger />
          </div>
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 w-full"
                />
              </div>
            </form>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {menuItems.map((section, index) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/help">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

