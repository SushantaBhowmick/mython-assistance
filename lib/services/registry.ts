import {
  Bell,
  BookOpen,
  Brain,
  LayoutDashboard,
  ListTodo,
  Music2,
  StickyNote,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ServiceId =
  | "dashboard"
  | "music"
  | "notes"
  | "tasks"
  | "reminders"
  | "learning"
  | "career"
  | "finance"
  | "ai"
  | "automation";

export type ServiceStatus = "active" | "coming_soon" | "planned";

export interface PersonalService {
  id: ServiceId;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: ServiceStatus;
  accent: string;
}

/** Single registry for all Personal OS modules — add services here as they ship. */
export const PERSONAL_SERVICES: PersonalService[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Command center and quick launcher",
    href: "/dashboard",
    icon: LayoutDashboard,
    status: "active",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    id: "music",
    name: "Music",
    description: "YouTube search, playlists, and global player",
    href: "/music",
    icon: Music2,
    status: "active",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    id: "notes",
    name: "Notes",
    description: "Personal knowledge and markdown notes",
    href: "/notes",
    icon: StickyNote,
    status: "active",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Priorities, due dates, and daily planning",
    href: "/tasks",
    icon: ListTodo,
    status: "active",
    accent: "from-sky-500/20 to-blue-500/10",
  },
  {
    id: "reminders",
    name: "Reminders",
    description: "Scheduled alerts linked to your workflow",
    href: "/reminders",
    icon: Bell,
    status: "active",
    accent: "from-rose-500/20 to-pink-500/10",
  },
  {
    id: "learning",
    name: "Learning",
    description: "Courses, progress, and revision",
    href: "/services/learning",
    icon: BookOpen,
    status: "planned",
    accent: "from-indigo-500/20 to-violet-500/10",
  },
  {
    id: "career",
    name: "Career",
    description: "Applications, interviews, and resume",
    href: "/services/career",
    icon: Brain,
    status: "planned",
    accent: "from-cyan-500/20 to-sky-500/10",
  },
  {
    id: "finance",
    name: "Finance",
    description: "Expenses, income, and goals",
    href: "/services/finance",
    icon: Wallet,
    status: "planned",
    accent: "from-lime-500/20 to-green-500/10",
  },
];

export function getActiveServices() {
  return PERSONAL_SERVICES.filter((service) => service.status === "active");
}

export function getLaunchableServices() {
  return PERSONAL_SERVICES.filter(
    (service) => service.id !== "dashboard" && service.status === "active",
  );
}

export function getServiceById(id: ServiceId) {
  return PERSONAL_SERVICES.find((service) => service.id === id);
}
