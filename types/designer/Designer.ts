// ── Graphic Designer Dashboard: Types + Static Mock Data ───────────────────
// Swap the mock arrays for real API calls later — shapes match exactly what
// the components expect, so wiring `api.get(...)` in is a drop-in swap.

export type TaskType =
  | "post"
  | "story"
  | "packaging"
  | "menu"
  | "reel_create"
  | "reel_edit"
  | "video_edit"
  | "news_edit"
  | "pdf"
  | "ppt"
  | "portfolio";

export type Frequency = "daily" | "weekly" | "monthly" | "additional";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "changes_requested"
  | "rejected"
  | "completed";

export interface ChangeLogEntry {
  id: string;
  changedBy: string;
  note: string;
  changedAt: string; // YYYY-MM-DD
  resolved: boolean;
  designerResponse?: string;
}

export interface DesignTask {
  id: string;
  title: string;
  description: string;
  brand: string;
  brandColor: string;
  taskType: TaskType;
  frequency: Frequency;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  status: TaskStatus;
  assignedBy: string;
  rejectRemark?: string;
  changes: ChangeLogEntry[];
  completedAt?: string;
}

export interface AdditionalWork {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "pending" | "completed";
  loggedBy: "self" | "admin";
}

// ── Presentation metadata for each task type ───────────────────────────────
export const TASK_TYPE_META: Record<TaskType, { label: string; bg: string; color: string }> = {
  post:        { label: "Social Post",   bg: "#eef2ff", color: "#4338ca" },
  story:       { label: "Story",         bg: "#fdf2f8", color: "#be185d" },
  packaging:   { label: "Packaging",     bg: "#fff7ed", color: "#c2410c" },
  menu:        { label: "Menu Design",   bg: "#f0fdf4", color: "#15803d" },
  reel_create: { label: "Reel (Create)", bg: "#fef9c3", color: "#a16207" },
  reel_edit:   { label: "Reel (Edit)",   bg: "#fae8ff", color: "#a21caf" },
  video_edit:  { label: "Video Edit",    bg: "#e0f2fe", color: "#0369a1" },
  news_edit:   { label: "News Edit",     bg: "#f1f5f9", color: "#334155" },
  pdf:         { label: "PDF Design",    bg: "#fef2f2", color: "#b91c1c" },
  ppt:         { label: "PPT Design",    bg: "#ecfeff", color: "#0e7490" },
  portfolio:   { label: "Portfolio",     bg: "#f5f3ff", color: "#6d28d9" },
};

export const FREQUENCY_META: Record<Frequency, { label: string; bg: string; color: string }> = {
  daily:      { label: "Daily",      bg: "#eff6ff", color: "#1d4ed8" },
  weekly:     { label: "Weekly",     bg: "#f5f3ff", color: "#7c3aed" },
  monthly:    { label: "Monthly",    bg: "#fdf2f8", color: "#be185d" },
  additional: { label: "Additional", bg: "#f0fdf4", color: "#15803d" },
};

// ── Date helpers (relative to real "today" so demo data always looks live) ─
const dayOffset = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

export const TODAY = dayOffset(0);
export const TOMORROW = dayOffset(1);

// ── Static Tasks ────────────────────────────────────────────────────────
export const mockTasks: DesignTask[] = [
  {
    id: "dt_001",
    title: "Instagram Post — Batch 12 Enrollment Open",
    description: "Square post announcing new 200Hr YTT batch enrollment, use golden-hour photo set.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "post",
    frequency: "daily",
    assignedDate: TODAY,
    dueDate: TODAY,
    status: "completed",
    assignedBy: "Admin",
    changes: [],
    completedAt: TODAY,
  },
  {
    id: "dt_002",
    title: "Story Set — Behind the Scenes Studio Shoot",
    description: "3-slide story series from yesterday's founder portrait shoot.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "story",
    frequency: "daily",
    assignedDate: TODAY,
    dueDate: TODAY,
    status: "in_progress",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "dt_003",
    title: "SLA Kit — Packaging Mockup Revision",
    description: "Update packaging design with new logo placement and QR code.",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    taskType: "packaging",
    frequency: "weekly",
    assignedDate: dayOffset(-2),
    dueDate: TODAY,
    status: "changes_requested",
    assignedBy: "Super Admin",
    rejectRemark: "Logo is too small on the front panel, and QR code overlaps the tagline. Please rework spacing.",
    changes: [
      {
        id: "ch_001",
        changedBy: "Super Admin",
        note: "Logo is too small on the front panel, and QR code overlaps the tagline. Please rework spacing.",
        changedAt: dayOffset(-1),
        resolved: false,
      },
    ],
  },
  {
    id: "dt_004",
    title: "Café Menu Redesign — Monsoon Specials",
    description: "Full A4 menu card with new seasonal items, keep existing brand typography.",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    taskType: "menu",
    frequency: "monthly",
    assignedDate: dayOffset(-5),
    dueDate: dayOffset(2),
    status: "in_progress",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "dt_005",
    title: "Fun Reel — Studio Bloopers Compilation",
    description: "Light, fun edit from raw bloopers footage collected over the week.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "reel_create",
    frequency: "weekly",
    assignedDate: dayOffset(-1),
    dueDate: TOMORROW,
    status: "pending",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "dt_006",
    title: "Sunrise Flow Reel — Color Grade Pass",
    description: "Edit down the sunrise flow footage into a 30s reel, warm color grade.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "reel_edit",
    frequency: "weekly",
    assignedDate: dayOffset(-3),
    dueDate: dayOffset(-1),
    status: "rejected",
    assignedBy: "Super Admin",
    rejectRemark: "Cuts feel too fast for a meditation reel — slow the pacing and extend b-roll shots.",
    changes: [
      {
        id: "ch_002",
        changedBy: "Super Admin",
        note: "Rejected by Super Admin: Cuts feel too fast for a meditation reel — slow the pacing and extend b-roll shots.",
        changedAt: dayOffset(-1),
        resolved: false,
      },
    ],
  },
  {
    id: "dt_007",
    title: "Founder Interview — Full Video Edit",
    description: "Edit full 8-minute founder interview with lower-thirds and brand outro.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "video_edit",
    frequency: "monthly",
    assignedDate: dayOffset(-6),
    dueDate: dayOffset(1),
    status: "in_progress",
    assignedBy: "Admin",
    changes: [
      {
        id: "ch_003",
        changedBy: "Admin",
        note: "Please add English subtitles in this pass too.",
        changedAt: dayOffset(-2),
        resolved: true,
        designerResponse: "Added — subtitles are burned in for the current cut.",
      },
    ],
  },
  {
    id: "dt_008",
    title: "Local Press Feature — News Clipping Cleanup",
    description: "Clean scan of newspaper feature, remove creases and enhance text clarity.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "news_edit",
    frequency: "additional",
    assignedDate: TODAY,
    dueDate: TODAY,
    status: "pending",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "dt_009",
    title: "Investor Brief — One-Pager PDF",
    description: "Single-page PDF summarizing Q2 numbers and roadmap, brand-consistent layout.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "pdf",
    frequency: "monthly",
    assignedDate: dayOffset(-4),
    dueDate: dayOffset(3),
    status: "pending",
    assignedBy: "Super Admin",
    changes: [],
  },
  {
    id: "dt_010",
    title: "Batch 12 Orientation — Slide Deck",
    description: "12-slide PPT for new student orientation, include curriculum timeline.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "ppt",
    frequency: "weekly",
    assignedDate: dayOffset(-1),
    dueDate: TOMORROW,
    status: "pending",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "dt_011",
    title: "Design Team Portfolio Page — Update",
    description: "Add last quarter's best 10 projects to the public portfolio page.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "portfolio",
    frequency: "monthly",
    assignedDate: dayOffset(-10),
    dueDate: dayOffset(-4),
    status: "completed",
    assignedBy: "Super Admin",
    changes: [],
    completedAt: dayOffset(-4),
  },
  {
    id: "dt_012",
    title: "Property Listing — Instagram Carousel",
    description: "5-slide carousel from Sector 14 villa shoot, highlight interiors.",
    brand: "Northline Realty",
    brandColor: "#10b981",
    taskType: "post",
    frequency: "daily",
    assignedDate: dayOffset(-7),
    dueDate: dayOffset(-7),
    status: "completed",
    assignedBy: "Admin",
    changes: [],
    completedAt: dayOffset(-7),
  },
  {
    id: "dt_013",
    title: "Team Culture Reel — Rough Cut Edit",
    description: "First pass edit of the HQ team culture footage.",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    taskType: "reel_edit",
    frequency: "weekly",
    assignedDate: dayOffset(-8),
    dueDate: dayOffset(-6),
    status: "completed",
    assignedBy: "Super Admin",
    changes: [],
    completedAt: dayOffset(-6),
  },
  {
    id: "dt_014",
    title: "Weekend Story Highlights Cover Icons",
    description: "Set of 6 story highlight cover icons matching brand palette.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "story",
    frequency: "monthly",
    assignedDate: dayOffset(-12),
    dueDate: dayOffset(-9),
    status: "completed",
    assignedBy: "Admin",
    changes: [],
    completedAt: dayOffset(-9),
  },
];

// ── Static Additional Work ─────────────────────────────────────────────────
export const mockAdditionalWork: AdditionalWork[] = [
  {
    id: "aw_d001",
    title: "Urgent — resize logo pack for print vendor",
    description: "Admin needed CMYK-ready logo files same day for a print order.",
    date: TODAY,
    status: "completed",
    loggedBy: "admin",
  },
  {
    id: "aw_d002",
    title: "Organized shared design assets drive",
    description: "Cleaned up and re-labeled brand folders on the shared drive for easier access.",
    date: TODAY,
    status: "pending",
    loggedBy: "self",
  },
  {
    id: "aw_d003",
    title: "Quick banner for internal team meeting",
    description: "One-off Zoom background banner requested by Super Admin.",
    date: dayOffset(-1),
    status: "completed",
    loggedBy: "admin",
  },
];