import {
  Code2,
  Palette,
  Megaphone,
  BookOpen,
  Camera,
  Music,
  Activity,
  Briefcase,
  Terminal,
  Database,
  Server,
  Cloud,
  GitBranch,
  Code,
} from "lucide-react"

export const categories = [
  {
    id: "programming",
    label: "Programming",
    description: "Software development and coding",
    icon: Code2,
    color:
      "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500",
  },
  {
    id: "web-development",
    label: "Web Development",
    description: "Frontend and backend web development",
    icon: Terminal,
    color:
      "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 data-[state=checked]:border-cyan-500 data-[state=checked]:text-cyan-500",
  },
  {
    id: "data-science",
    label: "Data Science",
    description: "Data analysis, machine learning, and AI",
    icon: Database,
    color:
      "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 data-[state=checked]:border-yellow-500 data-[state=checked]:text-yellow-500",
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Infrastructure, CI/CD, and cloud operations",
    icon: Server,
    color:
      "bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20 data-[state=checked]:border-gray-500 data-[state=checked]:text-gray-500",
  },
  {
    id: "cloud-computing",
    label: "Cloud Computing",
    description: "Cloud infrastructure and services",
    icon: Cloud,
    color:
      "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20 data-[state=checked]:border-sky-500 data-[state=checked]:text-sky-500",
  },
  {
    id: "version-control",
    label: "Version Control",
    description: "Git and version control systems",
    icon: GitBranch,
    color:
      "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 data-[state=checked]:border-orange-500 data-[state=checked]:text-orange-500",
  },
  {
    id: "software-architecture",
    label: "Software Architecture",
    description: "Designing scalable and maintainable systems",
    icon: Code,
    color:
      "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 data-[state=checked]:border-violet-500 data-[state=checked]:text-violet-500",
  },
  {
    id: "design",
    label: "Design",
    description: "UI/UX and graphic design",
    icon: Palette,
    color:
      "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 data-[state=checked]:border-purple-500 data-[state=checked]:text-purple-500",
  },
  {
    id: "business",
    label: "Business",
    description: "Entrepreneurship and management",
    icon: Briefcase,
    color:
      "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500",
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Digital marketing and advertising",
    icon: Megaphone,
    color:
      "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 data-[state=checked]:border-green-500 data-[state=checked]:text-green-500",
  },
  {
    id: "education",
    label: "Education",
    description: "Teaching and learning",
    icon: BookOpen,
    color:
      "bg-accent/10 hover:bg-accent/20 border-accent/20 data-[state=checked]:border-accent data-[state=checked]:text-accent",
  },
  {
    id: "photography",
    label: "Photography",
    description: "Digital photography and editing",
    icon: Camera,
    color:
      "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-500",
  },
  {
    id: "music",
    label: "Music",
    description: "Music production and theory",
    icon: Music,
    color:
      "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20 data-[state=checked]:border-pink-500 data-[state=checked]:text-pink-500",
  },
  {
    id: "health",
    label: "Health & Fitness",
    description: "Wellness and physical fitness",
    icon: Activity,
    color:
      "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20 data-[state=checked]:border-teal-500 data-[state=checked]:text-teal-500",
  },
]

export type CategoryId = (typeof categories)[number]["id"]
