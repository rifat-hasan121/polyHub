import {
  BookOpen,
  Briefcase,
  Calculator,
  FolderGit2,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Materials & Syllabus",
    href: "/materials",
    icon: BookOpen,
  },
  {
    title: "CGPA Calculator",
    href: "/cgpa-calculator",
    icon: Calculator,
    badge: "New",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderGit2,
  },
  {
    title: "Attachment & Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Community",
    href: "/community",
    icon: MessageSquare,
  },
];
