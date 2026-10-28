import {
  BookOpen,
  Briefcase,
  Calculator,
  ClipboardList,
  FileText,
  FolderGit2,
  LayoutDashboard,
  GraduationCap,
  MessageSquare,
  UserRound,
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
    title: "My Profile",
    href: "/dashboard/profile",
    icon: UserRound,
  },
  {
    title: "My Uploads",
    href: "/dashboard/my-materials",
    icon: ClipboardList,
  },
  {
    title: "My Higher-Study Posts",
    href: "/dashboard/my-higher-study",
    icon: GraduationCap,
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
