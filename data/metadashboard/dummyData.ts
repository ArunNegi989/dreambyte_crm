// data/metadashboard/dummyData.ts
// Dummy data + types for the Meta Dashboard. Swap the arrays/functions below
// for real API calls whenever the backend is ready — shapes are kept 1:1
// with what the components expect.

export type Category =
  | 'metaAds'
  | 'googleAds'
  | 'automation'
  | 'campaignOptimization'
  | 'creativePlanning'
  | 'analyticsTracking'
  | 'websiteAnalysis'
  | 'adsStrategy';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type AdditionalWorkStatus = 'pending' | 'completed';

export interface CategoryMeta {
  label: string;
  color: string; // used for chips/bars
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  metaAds: { label: 'Meta Ads', color: '#1877F2' },
  googleAds: { label: 'Google Ads', color: '#EA4335' },
  automation: { label: 'Automation Strategies', color: '#8B5CF6' },
  campaignOptimization: { label: 'Campaign Optimization', color: '#F59E0B' },
  creativePlanning: { label: 'Creative Planning', color: '#EC4899' },
  analyticsTracking: { label: 'Analytics Tracking', color: '#10B981' },
  websiteAnalysis: { label: 'Website Analysis', color: '#06B6D4' },
  adsStrategy: { label: 'Ads Strategy Implementation', color: '#4F46E5' },
};

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_META) as Category[]).map((value) => ({
  value,
  label: CATEGORY_META[value].label,
}));

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string; // ISO yyyy-mm-dd
  description: string;
  details: Record<string, string>;
  remarks?: string;
}

export interface AdditionalTask {
  id: string;
  title: string;
  category: Category | 'other';
  description: string;
  date: string;
  hoursSpent: number | '';
  outcome: string;
  status: AdditionalWorkStatus;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
}

const todayOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const CURRENT_EMPLOYEE = '';

export const DUMMY_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Launch retargeting campaign for cart abandoners',
    category: 'metaAds',
    priority: 'urgent',
    status: 'in-progress',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(0),
    description: 'Set up a Meta retargeting campaign for users who abandoned cart in last 14 days.',
    details: {
      Platform: 'Facebook & Instagram',
      Budget: '$1,200 / month',
      Audience: 'Cart abandoners (14d)',
      Objective: 'Conversions',
    },
  },
  {
    id: 't2',
    title: 'Optimize Search campaign keywords',
    category: 'googleAds',
    priority: 'high',
    status: 'pending',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(0),
    description: 'Review search terms report and add negative keywords to cut wasted spend.',
    details: {
      Campaign: 'Search - Brand + Generic',
      'Current CTR': '3.1%',
      'Target CTR': '4%+',
    },
  },
  {
    id: 't3',
    title: 'Build lead-nurture email automation',
    category: 'automation',
    priority: 'medium',
    status: 'pending',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(1),
    description: 'Create a 5-step drip sequence for new leads coming from the landing page form.',
    details: {
      Tool: 'HubSpot Workflows',
      Steps: '5',
      Trigger: 'Form submission',
    },
  },
  {
    id: 't4',
    title: 'A/B test landing page CTA placement',
    category: 'campaignOptimization',
    priority: 'medium',
    status: 'in-progress',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(2),
    description: 'Run a split test comparing top vs sticky-bottom CTA button on the pricing page.',
    details: {
      Variants: '2',
      'Traffic split': '50/50',
      'Sample size goal': '2,000 visitors',
    },
  },
  {
    id: 't5',
    title: 'Design 3 new static ad creatives',
    category: 'creativePlanning',
    priority: 'high',
    status: 'pending',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(-1),
    description: 'Produce 3 static creatives for the summer sale campaign, 1:1 and 4:5 formats.',
    details: {
      Formats: '1:1, 4:5',
      Theme: 'Summer Sale',
      Deliverables: '3 static + 1 carousel',
    },
  },
  {
    id: 't6',
    title: 'Set up GA4 conversion events',
    category: 'analyticsTracking',
    priority: 'urgent',
    status: 'blocked',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(-2),
    description: 'Configure GA4 custom events for checkout, add-to-cart and newsletter signup.',
    details: {
      Property: 'GA4 - Main Site',
      'Blocked reason': 'Waiting on GTM access from client',
    },
  },
  {
    id: 't7',
    title: 'Audit website page speed & Core Web Vitals',
    category: 'websiteAnalysis',
    priority: 'medium',
    status: 'completed',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(-3),
    description: 'Run Lighthouse + PageSpeed audits on top 5 landing pages and log recommendations.',
    details: {
      'Pages audited': '5',
      'Avg. LCP': '2.8s',
      'Avg. CLS': '0.06',
    },
    remarks: 'Shared report with dev team, 3 fixes already shipped.',
  },
  {
    id: 't8',
    title: 'Draft Q3 paid ads strategy document',
    category: 'adsStrategy',
    priority: 'high',
    status: 'in-progress',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(3),
    description: 'Put together the channel mix, budget split and KPI targets for Q3.',
    details: {
      Quarter: 'Q3 2026',
      Channels: 'Meta, Google, LinkedIn',
    },
  },
  {
    id: 't9',
    title: 'Refresh video ad hooks for Reels',
    category: 'creativePlanning',
    priority: 'low',
    status: 'pending',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(4),
    description: 'Write 5 new hook variations for the top-performing Reels ad.',
    details: {
      'Hooks needed': '5',
      Format: 'Reels 9:16',
    },
  },
  {
    id: 't10',
    title: 'Weekly performance report for client',
    category: 'analyticsTracking',
    priority: 'medium',
    status: 'completed',
    assignedTo: CURRENT_EMPLOYEE,
    dueDate: todayOffset(-1),
    description: 'Compile weekly performance report covering Meta, Google and website traffic.',
    details: {
      'Report period': 'Last 7 days',
      Format: 'PDF + Loom walkthrough',
    },
    remarks: 'Sent Monday 9am, client acknowledged.',
  },
];

export const DUMMY_ADDITIONAL_TASKS: AdditionalTask[] = [
  {
    id: 'a1',
    title: 'Competitor ad library research',
    category: 'metaAds',
    description: 'Reviewed Meta ad library for 3 competitors to spot creative trends.',
    date: todayOffset(-2),
    hoursSpent: 1.5,
    outcome: 'Found 2 new hook formats to test next sprint.',
    status: 'completed',
  },
  {
    id: 'a2',
    title: 'Fixed broken UTM links',
    category: 'analyticsTracking',
    description: 'Noticed and corrected malformed UTM parameters on 4 email campaigns.',
    date: todayOffset(-4),
    hoursSpent: 0.75,
    outcome: 'Attribution data now accurate for those campaigns.',
    status: 'completed',
  },
  {
    id: 'a3',
    title: 'Helped onboard new client in CRM',
    category: 'other',
    description: 'Set up new client workspace, folders and access for the onboarding call.',
    date: todayOffset(-6),
    hoursSpent: 1,
    outcome: 'Client onboarded same day, kickoff call went smoothly.',
    status: 'pending',
  },
];

export const PERFORMANCE_METRICS: PerformanceMetric[] = [
  { label: 'Total Ad Spend', value: '$18,420', change: '+8.2%', trend: 'up' },
  { label: 'ROAS', value: '4.6x', change: '+0.4x', trend: 'up' },
  { label: 'Leads Generated', value: '312', change: '+12%', trend: 'up' },
  { label: 'Website Visitors', value: '24.1K', change: '-3.1%', trend: 'down' },
  { label: 'Conversion Rate', value: '3.4%', change: '+0.2%', trend: 'up' },
  { label: 'Active Campaigns', value: '9', change: '0', trend: 'flat' },
];

export function computeStats(tasks: Task[]) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.dueDate < today && t.status !== 'completed').length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const byCategory = new Map<Category, number>();
  tasks.forEach((t) => byCategory.set(t.category, (byCategory.get(t.category) || 0) + 1));
  const categoryBreakdown = Array.from(byCategory.entries()).map(([category, count]) => ({ category, count }));

  return { total, pending, inProgress, completed, blocked, overdue, completionRate, categoryBreakdown };
}