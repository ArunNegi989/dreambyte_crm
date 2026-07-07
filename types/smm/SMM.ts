// ── SMM (Social Media Manager) Dashboard: Types + Static Mock Data ─────────
// Swap the mock arrays for real API calls later — shapes match exactly what
// the components expect, so wiring `api.get(...)` in is a drop-in swap.

export type TaskType =
  | "scripting"
  | "ugc"
  | "references"
  | "pitch_deck"
  | "market_research"
  | "content_calendar";

export type ContentType = "post" | "video" | "story";

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
  smmResponse?: string;
}

// ── General SMM tasks (everything except posting, which gets its own
// dedicated brand-coverage tracker below) ──────────────────────────────────
export interface SMMTask {
  id: string;
  title: string;
  description: string;
  brand: string;
  brandColor: string;
  taskType: TaskType;
  frequency: Frequency;
  assignedDate: string;
  dueDate: string;
  status: TaskStatus;
  assignedBy: string;
  rejectRemark?: string;
  changes: ChangeLogEntry[];
  completedAt?: string;
}

// ── Posting entries — one per brand + content type + date, so coverage is
// always crystal clear: "did Brand X's post go out today? What about their
// story? Their reel?" ──────────────────────────────────────────────────────
export interface PostingEntry {
  id: string;
  brand: string;
  brandColor: string;
  contentType: ContentType;
  title: string;
  date: string;
  status: TaskStatus;
  assignedBy: string;
  rejectRemark?: string;
  changes: ChangeLogEntry[];
}

export interface AdditionalWork {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "pending" | "completed";
  loggedBy: "self" | "admin";
}

// ── Presentation metadata ──────────────────────────────────────────────────
export const TASK_TYPE_META: Record<TaskType, { label: string; bg: string; color: string }> = {
  scripting:        { label: "Scripting",        bg: "#ecfeff", color: "#0e7490" },
  ugc:              { label: "UGC",               bg: "#fdf4ff", color: "#a21caf" },
  references:       { label: "References",       bg: "#f1f5f9", color: "#334155" },
  pitch_deck:       { label: "Pitch Deck",        bg: "#eef2ff", color: "#4338ca" },
  market_research:  { label: "Market Research",   bg: "#fff7ed", color: "#c2410c" },
  content_calendar: { label: "Content Calendar",  bg: "#f0fdf4", color: "#15803d" },
};

export const CONTENT_TYPE_META: Record<ContentType, { label: string; bg: string; color: string; icon: string }> = {
  post:  { label: "Post",  bg: "#eef2ff", color: "#4338ca", icon: "🖼️" },
  video: { label: "Video", bg: "#fdf2f8", color: "#be185d", icon: "🎬" },
  story: { label: "Story", bg: "#fefce8", color: "#a16207", icon: "⚡" },
};

export const FREQUENCY_META: Record<Frequency, { label: string; bg: string; color: string }> = {
  daily:      { label: "Daily",      bg: "#eff6ff", color: "#1d4ed8" },
  weekly:     { label: "Weekly",     bg: "#f5f3ff", color: "#7c3aed" },
  monthly:    { label: "Monthly",    bg: "#fdf2f8", color: "#be185d" },
  additional: { label: "Additional", bg: "#f0fdf4", color: "#15803d" },
};

export const BRANDS = [
  { name: "AYM Yoga School", color: "#f59e0b" },
  { name: "Yakka Puka", color: "#6366f1" },
  { name: "Dream Byte Studio", color: "#ec4899" },
  { name: "Northline Realty", color: "#10b981" },
];

// ── Date helpers ────────────────────────────────────────────────────────
const dayOffset = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

export const TODAY = dayOffset(0);
export const TOMORROW = dayOffset(1);

// ── Static Tasks (non-posting) ─────────────────────────────────────────────
export const mockTasks: SMMTask[] = [
  {
    id: "st_001",
    title: "Script — Sunrise Flow Reel Voiceover",
    description: "Write the calm, guided-meditation style voiceover script for the sunrise flow reel.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "scripting",
    frequency: "daily",
    assignedDate: TODAY,
    dueDate: TODAY,
    status: "completed",
    assignedBy: "Admin",
    changes: [],
    completedAt: TODAY,
  },
  {
    id: "st_002",
    title: "UGC Script — Student Testimonial Prompts",
    description: "Draft 5 prompt questions to guide graduating students' testimonial videos.",
    brand: "AYM Yoga School",
    brandColor: "#f59e0b",
    taskType: "ugc",
    frequency: "weekly",
    assignedDate: dayOffset(-1),
    dueDate: TODAY,
    status: "in_progress",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "st_003",
    title: "Competitor Reference Board — Packaging Reels",
    description: "Collect 10 reference reels from competitor packaging brands for the new SLA kit launch.",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    taskType: "references",
    frequency: "weekly",
    assignedDate: dayOffset(-3),
    dueDate: TODAY,
    status: "changes_requested",
    assignedBy: "Super Admin",
    rejectRemark: "Most references are too corporate — find more playful, Gen-Z leaning packaging reels instead.",
    changes: [
      {
        id: "sch_001",
        changedBy: "Super Admin",
        note: "Most references are too corporate — find more playful, Gen-Z leaning packaging reels instead.",
        changedAt: dayOffset(-1),
        resolved: false,
      },
    ],
  },
  {
    id: "st_004",
    title: "Investor Pitch Deck — Social Growth Slide",
    description: "Add a slide summarizing last quarter's follower growth and engagement rate to the deck.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "pitch_deck",
    frequency: "monthly",
    assignedDate: dayOffset(-4),
    dueDate: dayOffset(2),
    status: "in_progress",
    assignedBy: "Super Admin",
    changes: [
      {
        id: "sch_002",
        changedBy: "Super Admin",
        note: "Use the same chart style as the finance deck for consistency.",
        changedAt: dayOffset(-2),
        resolved: true,
        smmResponse: "Updated — matched the finance deck's bar chart style and color palette.",
      },
    ],
  },
  {
    id: "st_005",
    title: "Market Research — Realty Reels Trend Report",
    description: "Research what's currently trending in real-estate reels across Instagram and YouTube Shorts.",
    brand: "Northline Realty",
    brandColor: "#10b981",
    taskType: "market_research",
    frequency: "monthly",
    assignedDate: dayOffset(-6),
    dueDate: dayOffset(1),
    status: "pending",
    assignedBy: "Admin",
    changes: [],
  },
  {
    id: "st_006",
    title: "August Content Calendar — All Brands",
    description: "Plan out the full August posting calendar across all 4 brands, balancing post/video/story mix.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "content_calendar",
    frequency: "monthly",
    assignedDate: dayOffset(-2),
    dueDate: TOMORROW,
    status: "pending",
    assignedBy: "Super Admin",
    changes: [],
  },
  {
    id: "st_007",
    title: "Script — Property Walkthrough Voiceover",
    description: "Write the walkthrough narration script for the Sector 14 villa video.",
    brand: "Northline Realty",
    brandColor: "#10b981",
    taskType: "scripting",
    frequency: "weekly",
    assignedDate: dayOffset(-2),
    dueDate: dayOffset(-1),
    status: "rejected",
    assignedBy: "Admin",
    rejectRemark: "Too much technical jargon — rewrite in a warmer, more conversational tone for buyers.",
    changes: [
      {
        id: "sch_003",
        changedBy: "Admin",
        note: "Rejected by Admin: Too much technical jargon — rewrite in a warmer, more conversational tone for buyers.",
        changedAt: dayOffset(-1),
        resolved: false,
      },
    ],
  },
  {
    id: "st_008",
    title: "UGC Script — Team Culture Reel Interview Qs",
    description: "Prepare fun, casual interview questions for the team culture reel.",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    taskType: "ugc",
    frequency: "weekly",
    assignedDate: dayOffset(-9),
    dueDate: dayOffset(-7),
    status: "completed",
    assignedBy: "Super Admin",
    changes: [],
    completedAt: dayOffset(-7),
  },
  {
    id: "st_009",
    title: "Reference Board — Menu Launch Story Templates",
    description: "Gather 8 story template references for the monsoon menu launch announcement.",
    brand: "Yakka Puka",
    brandColor: "#6366f1",
    taskType: "references",
    frequency: "monthly",
    assignedDate: dayOffset(-11),
    dueDate: dayOffset(-8),
    status: "completed",
    assignedBy: "Admin",
    changes: [],
    completedAt: dayOffset(-8),
  },
  {
    id: "st_010",
    title: "July Content Calendar — Final Review",
    description: "Finalize July's calendar across all brands before month start.",
    brand: "Dream Byte Studio",
    brandColor: "#ec4899",
    taskType: "content_calendar",
    frequency: "monthly",
    assignedDate: dayOffset(-14),
    dueDate: dayOffset(-12),
    status: "completed",
    assignedBy: "Super Admin",
    changes: [],
    completedAt: dayOffset(-12),
  },
];

// ── Static Posting Entries (brand × content-type × date coverage) ─────────
export const mockPostingEntries: PostingEntry[] = [
  // ── Today ──
  { id: "pe_001", brand: "AYM Yoga School", brandColor: "#f59e0b", contentType: "post", title: "Batch 12 Enrollment Announcement", date: TODAY, status: "completed", assignedBy: "Admin", changes: [] },
  { id: "pe_002", brand: "AYM Yoga School", brandColor: "#f59e0b", contentType: "story", title: "Behind-the-Scenes Sunrise Shoot", date: TODAY, status: "completed", assignedBy: "Admin", changes: [] },
  { id: "pe_003", brand: "Yakka Puka", brandColor: "#6366f1", contentType: "post", title: "New SLA Kit Packaging Reveal", date: TODAY, status: "in_progress", assignedBy: "Super Admin", changes: [] },
  { id: "pe_004", brand: "Yakka Puka", brandColor: "#6366f1", contentType: "video", title: "Team Culture Reel", date: TODAY, status: "changes_requested", assignedBy: "Super Admin",
    rejectRemark: "Trim the intro by 3 seconds, it drags before the hook.",
    changes: [{ id: "pch_001", changedBy: "Super Admin", note: "Trim the intro by 3 seconds, it drags before the hook.", changedAt: TODAY, resolved: false }] },
  { id: "pe_005", brand: "Dream Byte Studio", brandColor: "#ec4899", contentType: "story", title: "Founder Portrait Session BTS", date: TODAY, status: "pending", assignedBy: "Admin", changes: [] },
  { id: "pe_006", brand: "Northline Realty", brandColor: "#10b981", contentType: "video", title: "Sector 14 Villa Walkthrough", date: TODAY, status: "pending", assignedBy: "Admin", changes: [] },

  // ── Yesterday ──
  { id: "pe_007", brand: "AYM Yoga School", brandColor: "#f59e0b", contentType: "video", title: "Morning Meditation Reel", date: dayOffset(-1), status: "completed", assignedBy: "Admin", changes: [] },
  { id: "pe_008", brand: "Yakka Puka", brandColor: "#6366f1", contentType: "story", title: "Monsoon Menu Teaser", date: dayOffset(-1), status: "completed", assignedBy: "Super Admin", changes: [] },
  { id: "pe_009", brand: "Dream Byte Studio", brandColor: "#ec4899", contentType: "post", title: "Client Testimonial Card", date: dayOffset(-1), status: "rejected", assignedBy: "Super Admin",
    rejectRemark: "Testimonial quote text is hard to read against the background — increase contrast.",
    changes: [{ id: "pch_002", changedBy: "Super Admin", note: "Rejected by Super Admin: Testimonial quote text is hard to read against the background — increase contrast.", changedAt: dayOffset(-1), resolved: false }] },
  { id: "pe_010", brand: "Northline Realty", brandColor: "#10b981", contentType: "post", title: "Sector 9 Listing Carousel", date: dayOffset(-1), status: "completed", assignedBy: "Admin", changes: [] },

  // ── Tomorrow (scheduled) ──
  { id: "pe_011", brand: "AYM Yoga School", brandColor: "#f59e0b", contentType: "post", title: "Graduate Testimonial Highlight", date: TOMORROW, status: "pending", assignedBy: "Admin", changes: [] },
  { id: "pe_012", brand: "Yakka Puka", brandColor: "#6366f1", contentType: "video", title: "HQ Team Culture Full Cut", date: TOMORROW, status: "pending", assignedBy: "Super Admin", changes: [] },
  { id: "pe_013", brand: "Dream Byte Studio", brandColor: "#ec4899", contentType: "story", title: "Portfolio Update Announcement", date: TOMORROW, status: "pending", assignedBy: "Admin", changes: [] },
];

// ── Static Additional Work ─────────────────────────────────────────────────
export const mockAdditionalWork: AdditionalWork[] = [
  {
    id: "smaw_001",
    title: "Urgent — respond to viral comment thread",
    description: "AYM's sunrise reel got unexpected traction, admin asked to jump in and manage comments same day.",
    date: TODAY,
    status: "completed",
    loggedBy: "admin",
  },
  {
    id: "smaw_002",
    title: "Competitor account audit — Yakka Puka category",
    description: "Did a quick self-initiated audit of 5 competitor accounts for posting frequency benchmarks.",
    date: TODAY,
    status: "pending",
    loggedBy: "self",
  },
  {
    id: "smaw_003",
    title: "Quick caption rewrite for boosted post",
    description: "Super Admin wanted a punchier caption before boosting the SLA kit post with ad spend.",
    date: dayOffset(-1),
    status: "completed",
    loggedBy: "admin",
  },
];