import { SeoCategory } from '../../../types/seodashboard/task';

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'url' | 'multiselect';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  placeholder?: string;
}

export interface CategoryFieldConfig {
  isList: boolean; // true = task can have multiple rows of this shape (backlinks, keywords, rankings)
  addLabel?: string; // button label for adding a row, when isList
  emptyRowLabel?: string;
  fields: FieldDef[];
}

export const CATEGORY_FIELD_CONFIG: Record<SeoCategory, CategoryFieldConfig> = {
  gmb_handling: {
    isList: false,
    fields: [
      { name: 'businessName', label: 'Business name', type: 'text', placeholder: 'e.g. Urban Bites Cafe' },
      {
        name: 'actionType', label: 'Action type', type: 'select',
        options: [
          { value: 'post_update', label: 'Post update' },
          { value: 'review_reply', label: 'Review reply' },
          { value: 'listing_update', label: 'Listing update' },
          { value: 'photo_upload', label: 'Photo upload' },
          { value: 'qna_response', label: 'Q&A response' },
        ],
      },
      { name: 'platform', label: 'Platform', type: 'text', placeholder: 'Google Business Profile' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What was updated / who was responded to' },
    ],
  },
  gmb_report: {
    isList: false,
    fields: [
      { name: 'period', label: 'Reporting period', type: 'text', placeholder: 'e.g. June 2026' },
      { name: 'views', label: 'Profile views', type: 'number' },
      { name: 'searchQueries', label: 'Search queries', type: 'number' },
      { name: 'calls', label: 'Calls', type: 'number' },
      { name: 'directionRequests', label: 'Direction requests', type: 'number' },
      { name: 'websiteClicks', label: 'Website clicks', type: 'number' },
      { name: 'notes', label: 'Summary / notes', type: 'textarea' },
    ],
  },
  backlinks: {
    isList: true,
    addLabel: 'Add backlink',
    emptyRowLabel: 'No backlinks added yet.',
    fields: [
      { name: 'sourceUrl', label: 'Source URL', type: 'url', placeholder: 'https://site-linking-to-you.com/article' },
      { name: 'targetUrl', label: 'Target URL', type: 'url', placeholder: 'https://yourclient.com/page' },
      { name: 'anchorText', label: 'Anchor text', type: 'text' },
      {
        name: 'linkType', label: 'Link type', type: 'select',
        options: [
          { value: 'dofollow', label: 'Dofollow' },
          { value: 'nofollow', label: 'Nofollow' },
        ],
      },
      {
        name: 'placementType', label: 'Placement type', type: 'select',
        options: [
          { value: 'guest_post', label: 'Guest post' },
          { value: 'blog_comment', label: 'Blog comment' },
          { value: 'directory', label: 'Directory' },
          { value: 'forum', label: 'Forum' },
          { value: 'social_bookmark', label: 'Social bookmark' },
          { value: 'press_release', label: 'Press release' },
        ],
      },
      { name: 'domainAuthority', label: 'Domain authority', type: 'number', placeholder: '0–100' },
      {
        name: 'status', label: 'Status', type: 'select',
        options: [
          { value: 'submitted', label: 'Submitted' },
          { value: 'live', label: 'Live' },
          { value: 'rejected', label: 'Rejected' },
        ],
      },
    ],
  },
  search_console: {
    isList: false,
    fields: [
      {
        name: 'issueType', label: 'Issue type', type: 'select',
        options: [
          { value: 'coverage_error', label: 'Coverage error' },
          { value: 'mobile_usability', label: 'Mobile usability' },
          { value: 'core_web_vitals', label: 'Core Web Vitals' },
          { value: 'manual_action', label: 'Manual action' },
          { value: 'indexing', label: 'Indexing' },
        ],
      },
      { name: 'pagesAffected', label: 'Pages affected', type: 'number' },
      { name: 'clicks', label: 'Clicks', type: 'number' },
      { name: 'impressions', label: 'Impressions', type: 'number' },
      { name: 'ctr', label: 'CTR (%)', type: 'number' },
      { name: 'avgPosition', label: 'Avg. position', type: 'number' },
      { name: 'actionTaken', label: 'Action taken', type: 'textarea' },
    ],
  },
  content_optimization: {
    isList: false,
    fields: [
      { name: 'pageUrl', label: 'Page URL', type: 'url' },
      { name: 'targetKeyword', label: 'Target keyword', type: 'text' },
      { name: 'changesMade', label: 'Changes made', type: 'textarea' },
      { name: 'wordCount', label: 'Word count', type: 'number' },
      { name: 'seoScoreBefore', label: 'SEO score (before)', type: 'number' },
      { name: 'seoScoreAfter', label: 'SEO score (after)', type: 'number' },
    ],
  },
  keyword_research: {
    isList: true,
    addLabel: 'Add keyword',
    emptyRowLabel: 'No keywords added yet.',
    fields: [
      { name: 'keyword', label: 'Keyword', type: 'text' },
      { name: 'searchVolume', label: 'Search volume', type: 'number' },
      { name: 'difficulty', label: 'Difficulty (0–100)', type: 'number' },
      {
        name: 'intent', label: 'Search intent', type: 'select',
        options: [
          { value: 'informational', label: 'Informational' },
          { value: 'navigational', label: 'Navigational' },
          { value: 'transactional', label: 'Transactional' },
          { value: 'commercial', label: 'Commercial' },
        ],
      },
      { name: 'tool', label: 'Tool used', type: 'text', placeholder: 'Ahrefs, SEMrush, GSC…' },
    ],
  },
  seo_audit: {
    isList: false,
    fields: [
      { name: 'website', label: 'Website', type: 'url' },
      {
        name: 'auditType', label: 'Audit type', type: 'select',
        options: [
          { value: 'technical', label: 'Technical' },
          { value: 'on_page', label: 'On-page' },
          { value: 'off_page', label: 'Off-page' },
          { value: 'full', label: 'Full site audit' },
        ],
      },
      { name: 'issuesFound', label: 'Total issues found', type: 'number' },
      { name: 'criticalIssues', label: 'Critical issues', type: 'number' },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
    ],
  },
  blog_writing: {
    isList: false,
    fields: [
      { name: 'blogTitle', label: 'Blog / article title', type: 'text' },
      { name: 'targetKeyword', label: 'Target keyword', type: 'text' },
      { name: 'wordCount', label: 'Word count', type: 'number' },
      {
        name: 'publishStatus', label: 'Publish status', type: 'select',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'in_review', label: 'In review' },
          { value: 'published', label: 'Published' },
        ],
      },
      { name: 'publishUrl', label: 'Published URL', type: 'url', placeholder: 'Leave blank until published' },
    ],
  },
  website_ranking: {
    isList: true,
    addLabel: 'Add ranking check',
    emptyRowLabel: 'No ranking checks added yet.',
    fields: [
      { name: 'keyword', label: 'Keyword', type: 'text' },
      {
        name: 'searchEngine', label: 'Search engine', type: 'select',
        options: [
          { value: 'google', label: 'Google' },
          { value: 'bing', label: 'Bing' },
        ],
      },
      {
        name: 'device', label: 'Device', type: 'select',
        options: [
          { value: 'desktop', label: 'Desktop' },
          { value: 'mobile', label: 'Mobile' },
        ],
      },
      { name: 'previousRank', label: 'Previous rank', type: 'number' },
      { name: 'currentRank', label: 'Current rank', type: 'number' },
      { name: 'url', label: 'Ranking URL', type: 'url' },
    ],
  },
  on_page_seo: {
    isList: false,
    fields: [
      { name: 'pageUrl', label: 'Page URL', type: 'url' },
      {
        name: 'elementsUpdated', label: 'Elements updated', type: 'multiselect',
        options: [
          { value: 'title_tag', label: 'Title tag' },
          { value: 'meta_description', label: 'Meta description' },
          { value: 'headers', label: 'Headers (H1–H3)' },
          { value: 'alt_text', label: 'Image alt text' },
          { value: 'internal_linking', label: 'Internal linking' },
          { value: 'url_structure', label: 'URL structure' },
        ],
      },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  off_page_seo: {
    isList: false,
    fields: [
      {
        name: 'activityType', label: 'Activity type', type: 'select',
        options: [
          { value: 'guest_posting', label: 'Guest posting' },
          { value: 'social_bookmarking', label: 'Social bookmarking' },
          { value: 'directory_submission', label: 'Directory submission' },
          { value: 'influencer_outreach', label: 'Influencer outreach' },
          { value: 'forum_posting', label: 'Forum posting' },
        ],
      },
      { name: 'website', label: 'Website / platform', type: 'text' },
      { name: 'linksBuilt', label: 'Links built', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  technical_seo: {
    isList: false,
    fields: [
      {
        name: 'issueType', label: 'Issue type', type: 'select',
        options: [
          { value: 'site_speed', label: 'Site speed' },
          { value: 'mobile_friendliness', label: 'Mobile friendliness' },
          { value: 'schema_markup', label: 'Schema markup' },
          { value: 'xml_sitemap', label: 'XML sitemap' },
          { value: 'robots_txt', label: 'Robots.txt' },
          { value: 'crawl_errors', label: 'Crawl errors' },
          { value: 'https_ssl', label: 'HTTPS / SSL' },
          { value: 'canonical_tags', label: 'Canonical tags' },
        ],
      },
      { name: 'pageUrl', label: 'Page / site URL', type: 'url' },
      {
        name: 'status', label: 'Fix status', type: 'select',
        options: [
          { value: 'identified', label: 'Identified' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'resolved', label: 'Resolved' },
        ],
      },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
};
