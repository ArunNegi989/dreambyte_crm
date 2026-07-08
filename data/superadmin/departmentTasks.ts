// ── Department → Task Type mapping ─────────────────────────────────────────
// Used by SATasks (and any other assign-task form) to show a department-
// specific dropdown of work types once an employee is selected. Add new
// departments/tasks here — everything else picks it up automatically.

export const DEPARTMENTS = [
  "Graphic",
  "SMM",
  "Photography",
  "Meta Ads",
  "SEO",
  "Development",
  "Content Writer",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_TASKS: Record<Department, string[]> = {
  Graphic: [
    "Post Design",
    "Story",
    "Packaging",
    "Menu Design",
    "Fun Reel",
    "Editing Reels",
    "News Editing",
  ],
  SMM: [
    "Scripting",
    "UGC",
    "Posting",
    "References",
    "Pitch Deck",
    "Market Research",
    "Content Calendar",
  ],
  Photography: [
    "Shoots",
    "Photo Edit",
    "Video Edit",
  ],
  "Meta Ads": [
    "Meta Ads",
    "Google Ads",
    "Automation Strategy",
    "Campaign Optimization",
    "Creatives Planning",
    "Analytics Tracking",
    "Website Analysis",
    "Ads Strategy Implementation",
  ],
  SEO: [
    "GMB Handling",
    "GMB Report",
    "Creating Backlinks",
    "Google Search Console",
    "Content Optimization",
    "Keyword Research",
    "SEO Audit",
    "Writing Blogs / Articles",
    "Website Ranking",
  ],
  Development: [
    "Website Creation",
  ],
  "Content Writer": [
    "Write Content",
  ],
};

// Case/whitespace-insensitive lookup so it still works even if a department
// string is stored slightly differently (e.g. "graphic ", "SMM").
export const getTasksForDepartment = (department?: string | null): string[] => {
  if (!department) return [];
  const normalized = department.trim().toLowerCase();
  const match = DEPARTMENTS.find((d) => d.toLowerCase() === normalized);
  return match ? DEPARTMENT_TASKS[match] : [];
};