import {
  BookOpen,
  Briefcase,
  Calculator,
  FileText,
  FolderGit2,
  LayoutDashboard,
  GraduationCap,
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
    title: "Higher Study & DUET",
    href: "/higher-study",
    icon: GraduationCap,
    badge: "New",
  },
  {
    title: "BTEB Notices & Results",
    href: "/notices",
    icon: FileText,
  },
  {
    title: "Community",
    href: "/community",
    icon: MessageSquare,
  },
];
