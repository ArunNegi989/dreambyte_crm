// Core types for the SEO executive dashboard.
// Mirrors the shape of ../employee/task.ts but modelled around SEO deliverables
// (GMB, backlinks, GSC, content, keyword research, audits, blogs, rankings,
// on-page / off-page / technical SEO) instead of generic creative tasks.

export type SeoCategory =
  | 'gmb_handling'
  | 'gmb_report'
  | 'backlinks'
  | 'search_console'
  | 'content_optimization'
  | 'keyword_research'
  | 'seo_audit'
  | 'blog_writing'
  | 'website_ranking'
  | 'on_page_seo'
  | 'off_page_seo'
  | 'technical_seo';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface CategoryMeta {
  value: SeoCategory;
  label: string;
  shortLabel: string;
  group: 'on_page' | 'off_page' | 'technical' | 'reporting' | 'content';
}

export const CATEGORY_META: Record<SeoCategory, CategoryMeta> = {
  gmb_handling: { value: 'gmb_handling', label: 'GMB Handling', shortLabel: 'GMB', group: 'off_page' },
  gmb_report: { value: 'gmb_report', label: 'GMB Report', shortLabel: 'GMB Report', group: 'reporting' },
  backlinks: { value: 'backlinks', label: 'Creating Backlinks', shortLabel: 'Backlinks', group: 'off_page' },
  search_console: { value: 'search_console', label: 'Google Search Console', shortLabel: 'GSC', group: 'technical' },
  content_optimization: { value: 'content_optimization', label: 'Content Optimization', shortLabel: 'Content Opt.', group: 'content' },
  keyword_research: { value: 'keyword_research', label: 'Keyword Research', shortLabel: 'Keywords', group: 'content' },
  seo_audit: { value: 'seo_audit', label: 'SEO Audit', shortLabel: 'Audit', group: 'technical' },
  blog_writing: { value: 'blog_writing', label: 'Writing Blogs / Articles', shortLabel: 'Blog', group: 'content' },
  website_ranking: { value: 'website_ranking', label: 'Website Ranking', shortLabel: 'Ranking', group: 'reporting' },
  on_page_seo: { value: 'on_page_seo', label: 'On-Page SEO', shortLabel: 'On-Page', group: 'on_page' },
  off_page_seo: { value: 'off_page_seo', label: 'Off-Page SEO', shortLabel: 'Off-Page', group: 'off_page' },
  technical_seo: { value: 'technical_seo', label: 'Technical SEO', shortLabel: 'Technical', group: 'technical' },
};

export const CATEGORY_OPTIONS: CategoryMeta[] = Object.values(CATEGORY_META);

// ---- Per-category detail rows -------------------------------------------
// Categories flagged `isList` in fieldConfig store an array of rows (e.g. a
// task can have several backlinks, several keywords, several rank checks).
// Everything else stores a single detail object.

export interface BacklinkRow {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'dofollow' | 'nofollow';
  placementType: 'guest_post' | 'blog_comment' | 'directory' | 'forum' | 'social_bookmark' | 'press_release';
  domainAuthority: number | '';
  status: 'live' | 'submitted' | 'rejected';
}

export interface KeywordRow {
  id: string;
  keyword: string;
  searchVolume: number | '';
  difficulty: number | '';
  intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  tool: string;
}

export interface RankingRow {
  id: string;
  keyword: string;
  searchEngine: 'google' | 'bing';
  device: 'desktop' | 'mobile';
  previousRank: number | '';
  currentRank: number | '';
  url: string;
}

export interface GmbHandlingDetail {
  businessName: string;
  actionType: 'post_update' | 'review_reply' | 'listing_update' | 'photo_upload' | 'qna_response';
  platform: string;
  notes: string;
}

export interface GmbReportDetail {
  period: string;
  views: number | '';
  searchQueries: number | '';
  calls: number | '';
  directionRequests: number | '';
  websiteClicks: number | '';
  notes: string;
}

export interface SearchConsoleDetail {
  issueType: 'coverage_error' | 'mobile_usability' | 'core_web_vitals' | 'manual_action' | 'indexing';
  pagesAffected: number | '';
  clicks: number | '';
  impressions: number | '';
  ctr: number | '';
  avgPosition: number | '';
  actionTaken: string;
}

export interface ContentOptimizationDetail {
  pageUrl: string;
  targetKeyword: string;
  changesMade: string;
  wordCount: number | '';
  seoScoreBefore: number | '';
  seoScoreAfter: number | '';
}

export interface SeoAuditDetail {
  website: string;
  auditType: 'technical' | 'on_page' | 'off_page' | 'full';
  issuesFound: number | '';
  criticalIssues: number | '';
  recommendations: string;
}

export interface BlogWritingDetail {
  blogTitle: string;
  targetKeyword: string;
  wordCount: number | '';
  publishStatus: 'draft' | 'in_review' | 'published';
  publishUrl: string;
}

export interface OnPageSeoDetail {
  pageUrl: string;
  elementsUpdated: string[]; // title_tag, meta_description, headers, alt_text, internal_linking, url_structure
  notes: string;
}

export interface OffPageSeoDetail {
  activityType: 'guest_posting' | 'social_bookmarking' | 'directory_submission' | 'influencer_outreach' | 'forum_posting';
  website: string;
  linksBuilt: number | '';
  notes: string;
}

export interface TechnicalSeoDetail {
  issueType: 'site_speed' | 'mobile_friendliness' | 'schema_markup' | 'xml_sitemap' | 'robots_txt' | 'crawl_errors' | 'https_ssl' | 'canonical_tags';
  pageUrl: string;
  status: 'identified' | 'in_progress' | 'resolved';
  notes: string;
}

export interface TaskDetails {
  gmb_handling?: GmbHandlingDetail;
  gmb_report?: GmbReportDetail;
  backlinks?: BacklinkRow[];
  search_console?: SearchConsoleDetail;
  content_optimization?: ContentOptimizationDetail;
  keyword_research?: KeywordRow[];
  seo_audit?: SeoAuditDetail;
  blog_writing?: BlogWritingDetail;
  website_ranking?: RankingRow[];
  on_page_seo?: OnPageSeoDetail;
  off_page_seo?: OffPageSeoDetail;
  technical_seo?: TechnicalSeoDetail;
}

export interface Task {
  id: string;
  title: string;
  category: SeoCategory;
  description: string;
  clientName: string;
  brandName: string;
  assignedDate: string; // ISO date
  dueDate: string; // ISO date
  status: TaskStatus;
  priority: Priority;
  remarks?: string;
  submittedAt?: string | null;
  completedAt?: string | null;
  details?: TaskDetails;
}

export interface AdditionalTask {
  id: string;
  title: string;
  category?: SeoCategory | 'other';
  description: string;
  date: string; // ISO date
  hoursSpent: number | '';
  outcome: string;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  overdue: number;
  additionalTasksLogged: number;
  categoryBreakdown: { category: SeoCategory; count: number }[];
  completionRate: number; // 0-100
}


export interface TaskChange {
  id: string;
  changedBy: string;
  note: string;
  changedAt: string;
  resolved: boolean;
  employeeResponse: string;
}

export interface Task {
  id: string;
  title: string;
  category: SeoCategory;
  description: string;
  clientName: string;
  brandName: string;
  assignedDate: string;
  dueDate: string;
  status: TaskStatus;
  priority: Priority;
  remarks?: string;
  submittedAt?: string | null;
  completedAt?: string | null;
  details?: TaskDetails;
  rejectRemark?: string;      // ← add
  changes?: TaskChange[];     // ← add
}