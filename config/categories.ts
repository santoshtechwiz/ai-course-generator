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
      "bg-primary/10 hover:bg-primary/20 border-primary/20 data-[state=checked]:border-primary data-[state=checked]:text-primary",
  },
  {
    id: "web-development",
    label: "Web Development",
    description: "Frontend and backend web development",
    icon: Terminal,
    color:
      "bg-primary/10 hover:bg-primary/20 border-primary/20 data-[state=checked]:border-primary data-[state=checked]:text-primary",
  },
  {
    id: "data-science",
    label: "Data Science",
    description: "Data analysis, machine learning, and AI",
    icon: Database,
    color:
      "bg-warning/10 hover:bg-warning/20 border-warning/20 data-[state=checked]:border-warning data-[state=checked]:text-warning",
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Infrastructure, CI/CD, and cloud operations",
    icon: Server,
    color:
      "bg-muted/10 hover:bg-muted/20 border-muted/20 data-[state=checked]:border-muted data-[state=checked]:text-muted-foreground",
  },
  {
    id: "cloud-computing",
    label: "Cloud Computing",
    description: "Cloud infrastructure and services",
    icon: Cloud,
    color:
      "bg-primary/10 hover:bg-primary/20 border-primary/20 data-[state=checked]:border-primary data-[state=checked]:text-primary",
  },
  {
    id: "version-control",
    label: "Version Control",
    description: "Git and version control systems",
    icon: GitBranch,
    color:
      "bg-warning/10 hover:bg-warning/20 border-warning/20 data-[state=checked]:border-warning data-[state=checked]:text-warning",
  },
  {
    id: "software-architecture",
    label: "Software Architecture",
    description: "Designing scalable and maintainable systems",
    icon: Code,
    color:
      "bg-accent/10 hover:bg-accent/20 border-accent/20 data-[state=checked]:border-accent data-[state=checked]:text-accent",
  },
  {
    id: "design",
    label: "Design",
    description: "UI/UX and graphic design",
    icon: Palette,
    color:
      "bg-accent/10 hover:bg-accent/20 border-accent/20 data-[state=checked]:border-accent data-[state=checked]:text-accent",
  },
  {
    id: "business",
    label: "Business",
    description: "Entrepreneurship and management",
    icon: Briefcase,
    color:
      "bg-warning/10 hover:bg-warning/20 border-warning/20 data-[state=checked]:border-warning data-[state=checked]:text-warning",
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Digital marketing and advertising",
    icon: Megaphone,
    color:
      "bg-success/10 hover:bg-success/20 border-success/20 data-[state=checked]:border-success data-[state=checked]:text-success",
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
      "bg-primary/10 hover:bg-primary/20 border-primary/20 data-[state=checked]:border-primary data-[state=checked]:text-primary",
  },
  {
    id: "music",
    label: "Music",
    description: "Music production and theory",
    icon: Music,
    color:
      "bg-accent/10 hover:bg-accent/20 border-accent/20 data-[state=checked]:border-accent data-[state=checked]:text-accent",
  },
  {
    id: "health",
    label: "Health & Fitness",
    description: "Wellness and physical fitness",
    icon: Activity,
    color:
      "bg-accent/10 hover:bg-accent/20 border-accent/20 data-[state=checked]:border-accent data-[state=checked]:text-accent",
  },
]

export type CategoryId = (typeof categories)[number]["id"]

/**
 * Find a category by its id.
 * Returns null if not found to make callers handle absence gracefully.
 */
export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id) ?? null
}
