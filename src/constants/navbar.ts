import {
  LayoutDashboard,
  Vote,
  Megaphone,
  Users,
  FileText,
  ScanFace,
} from "lucide-react";

export const navList = [
  { title: "Dashboard", link: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Elections", link: "/admin/election", icon: Vote },
  { title: "Positions", link: "/admin/positions", icon: FileText },
  { title: "Candidates", link: "/admin/candidates", icon: Users },
  { title: "Users", link: "/admin/users", icon: Users },
  { title: "Face Verification", link: "/admin/face-verification", icon: ScanFace },
  { title: "Cast Vote", link: "/admin/cast-vote", icon: Vote },
  { title: "Campaigns", link: "/admin/campaigns", icon: Megaphone },
];

export const voterList = [
  { title: "Dashboard", link: "/voter/dashboard", icon: LayoutDashboard },
  { title: "Cast Vote", link: "/voter/cast-vote", icon: Vote },
  { title: "Campaigns", link: "/voter/campaigns", icon: Megaphone },
  { title: "Face Verification", link: "/voter/face-verification", icon: ScanFace },
];
