// ── Photographer Dashboard: Types + Static Mock Data ──────────────────────
// Swap the mock arrays below for real API calls later — the shape of each
// object is exactly what the components expect, so wiring in `api.get(...)`
// is a drop-in replacement.

export type WorkStatus = "pending" | "in_progress" | "completed";
export type MediaType = "photo" | "video" | "both";

// ── Shoots ──────────────────────────────────────────────────────────────
export interface Shoot {
  id: string;
  brand: string;
  brandColor: string; // hex, used for the little brand tag dot
  title: string;
  location: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "10:30 AM"
  type: MediaType;
  status: WorkStatus;
  assignedBy: string;
  notes?: string;
}

// ── Edits ───────────────────────────────────────────────────────────────
export interface EditTask {
  id: string;
  brand: string;
  brandColor: string;
  title: string;
  mediaType: "photo" | "video";
  totalCount: number;
  completedCount: number;
  date: string;
  deadline: string;
  status: WorkStatus;
  assignedBy: string;
  relatedShootId?: string;
}

// ── Additional / ad-hoc work ───────────────────────────────────────────
export interface AdditionalWork {
  id: string;
  title: string;
  description: string;
  date: string;
  status: WorkStatus;
  loggedBy: "self" | "admin";
}

// ── Helper: today's date in YYYY-MM-DD, used to seed realistic mock data ──
const todayStr = () => new Date().toISOString().split("T")[0];
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

export const TODAY = todayStr();
export const TOMORROW = tomorrowStr();
export const YESTERDAY = yesterdayStr();

// ── Static Shoots ──────────────────────────────────────────────────────
export const mockShoots: Shoot[] = [
  {
    id: "sh_001",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    title: "200Hr YTT Batch — Studio Session",
    location: "Rishikesh Riverside Studio",
    date: TODAY,
    time: "07:00 AM",
    type: "video",
    status: "completed",
    assignedBy: "Super Admin",
    notes: "Golden hour session, cover sunrise flow sequence.",
  },
  {
    id: "sh_002",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    title: "Product Shoot — New SLA Kit Packaging",
    location: "Dream Byte Studio, Dehradun",
    date: TODAY,
    time: "11:30 AM",
    type: "photo",
    status: "completed",
    assignedBy: "Admin",
  },
  {
    id: "sh_003",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    title: "Founder Portraits — Website Refresh",
    location: "Dream Byte Studio, Dehradun",
    date: TODAY,
    time: "03:00 PM",
    type: "photo",
    status: "in_progress",
    assignedBy: "Admin",
    notes: "Need both formal and candid sets.",
  },
  {
    id: "sh_004",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    title: "Testimonial Interviews — Batch 12 Graduates",
    location: "Rishikesh Riverside Studio",
    date: TODAY,
    time: "05:30 PM",
    type: "video",
    status: "pending",
    assignedBy: "Super Admin",
  },
  {
    id: "sh_005",
    brand: "Northline Realty",
    brandColor: "#10b981",
    title: "Property Walkthrough — Sector 14 Villa",
    location: "Sector 14, Dehradun",
    date: TOMORROW,
    time: "09:00 AM",
    type: "both",
    status: "pending",
    assignedBy: "Admin",
    notes: "Drone shots requested if weather permits.",
  },
  {
    id: "sh_006",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    title: "Team Culture Reel",
    location: "Yakka Puka HQ",
    date: TOMORROW,
    time: "02:00 PM",
    type: "video",
    status: "pending",
    assignedBy: "Super Admin",
  },
  {
    id: "sh_007",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    title: "Instagram Reel — Morning Meditation",
    location: "Riverside Ghat",
    date: YESTERDAY,
    time: "06:15 AM",
    type: "video",
    status: "completed",
    assignedBy: "Admin",
  },
];

// ── Static Edits ────────────────────────────────────────────────────────
export const mockEdits: EditTask[] = [
  {
    id: "ed_001",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    title: "Sunrise Flow — Color Grade + Cut",
    mediaType: "video",
    totalCount: 1,
    completedCount: 1,
    date: TODAY,
    deadline: TODAY,
    status: "completed",
    assignedBy: "Super Admin",
    relatedShootId: "sh_001",
  },
  {
    id: "ed_002",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    title: "SLA Kit Packaging — Product Retouch",
    mediaType: "photo",
    totalCount: 28,
    completedCount: 28,
    date: TODAY,
    deadline: TODAY,
    status: "completed",
    assignedBy: "Admin",
    relatedShootId: "sh_002",
  },
  {
    id: "ed_003",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    title: "Founder Portraits — Selects + Retouch",
    mediaType: "photo",
    totalCount: 40,
    completedCount: 22,
    date: TODAY,
    deadline: TOMORROW,
    status: "in_progress",
    assignedBy: "Admin",
    relatedShootId: "sh_003",
  },
  {
    id: "ed_004",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    title: "Batch 11 Graduation — Highlight Reel",
    mediaType: "video",
    totalCount: 1,
    completedCount: 0,
    date: TODAY,
    deadline: TOMORROW,
    status: "pending",
    assignedBy: "Super Admin",
  },
  {
    id: "ed_005",
    brand: "Northline Realty",
    brandColor: "#10b981",
    title: "Sector 9 Listing — Photo Set",
    mediaType: "photo",
    totalCount: 35,
    completedCount: 12,
    date: YESTERDAY,
    deadline: TODAY,
    status: "in_progress",
    assignedBy: "Admin",
  },
  {
    id: "ed_006",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    title: "Team Reel — Rough Cut",
    mediaType: "video",
    totalCount: 1,
    completedCount: 0,
    date: TOMORROW,
    deadline: TOMORROW,
    status: "pending",
    assignedBy: "Super Admin",
  },
];

// ── Static Additional Work ─────────────────────────────────────────────
export const mockAdditionalWork: AdditionalWork[] = [
  {
    id: "aw_001",
    title: "Equipment check — gimbal calibration",
    description: "Ronin gimbal was drifting on last shoot, recalibrated and tested before today's session.",
    date: TODAY,
    status: "completed",
    loggedBy: "self",
  },
  {
    id: "aw_002",
    title: "Backup yesterday's raw footage to drive",
    description: "Uploaded AYM sunrise flow raw files + Yakka Puka product RAWs to shared drive.",
    date: TODAY,
    status: "completed",
    loggedBy: "self",
  },
  {
    id: "aw_003",
    title: "Scout location for Sector 14 property shoot",
    description: "Admin requested a quick site visit ahead of tomorrow's realty shoot to plan angles.",
    date: TODAY,
    status: "pending",
    loggedBy: "admin",
  },
];