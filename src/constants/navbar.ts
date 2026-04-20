

import {
  LayoutDashboard,
  Vote,
  Megaphone,
  Users,
  FileText,
  ScanFace,
  Trophy,Settings
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
  { title: "Election Results", link: "/admin/results", icon: Trophy },
  { title: "Settings", link: "/admin/settings", icon: Settings }
];

export const voterList = [
  { title: "Dashboard", link: "/voter/dashboard", icon: LayoutDashboard },
  { title: "Cast Vote", link: "/voter/cast-vote", icon: Vote },
  { title: "Campaigns", link: "/voter/campaigns", icon: Megaphone },
  { title: "Face Verification", link: "/voter/face-verification", icon: ScanFace },
  { title: "Settings", link: "/settings", icon: Settings }
];


// export const navList = [
//   { title: "Dashboard", link: '/admin/dashboard' },
//   { title: "Elections", link: '/admin/election' },
//   { title: "Positions", link: '/admin/positions' },
//   { title: "Candidates", link: '/admin/candidates' },
//   { title: "Users", link: '/admin/users' },
//   { title: "Face Verification", link: '/admin/face-verification' },
//   { title: "Cast Vote", link: '/admin/cast-vote' },
//   { title: "Campaigns", link: '/admin/campaigns' },
// ]

// export const voterList = [
//   { title: "Dashboard", link: '/voter/dashboard' },
//   { title: "Cast Vote", link: '/voter/cast-vote' },
//   { title: "Campaigns", link: '/voter/campaigns' },
//   { title: "Face Verification", link: '/voter/face-verification' },
// ]