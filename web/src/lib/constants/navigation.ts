import {
  LayoutDashboard,
  Users,
  Phone,
  Calendar,
  RefreshCw,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const mainNavItems: NavItem[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Prospects",
    href: "/prospects",
    icon: Users,
  },
  {
    title: "Appels",
    href: "/calls",
    icon: Phone,
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
  },
  {
    title: "Relances",
    href: "/relances",
    icon: RefreshCw,
  },
  {
    title: "Parametres",
    href: "/parametres",
    icon: Settings,
  },
];

export const adminNavItems: NavItem[] = [
  {
    title: "Administration",
    href: "/admin",
    icon: Shield,
  },
];
