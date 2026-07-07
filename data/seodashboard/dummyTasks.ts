import { Task, AdditionalTask } from '../../../types/seodashboard/task';

// Dates are generated relative to "today" so the dashboard always shows a
// believable mix of overdue / due-today / upcoming / completed work no
// matter when this project is opened.
function isoDaysFromToday(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

let uid = 0;
function id(prefix: string): string {
  uid += 1;
  return `${prefix}_${uid}`;
}

export function buildDummyTasks(): Task[] {
  return [
    {
      id: id('task'),
      title: 'Update Google Business Profile for Q3 offers',
      category: 'gmb_handling',
      description: 'Post the new Q3 promotional offer and reply to the last 5 pending reviews.',
      clientName: 'Meera Kapoor',
      brandName: 'Urban Bites Cafe',
      assignedDate: isoDaysFromToday(-3),
      dueDate: isoDaysFromToday(-1),
      status: 'completed',
      priority: 'medium',
      submittedAt: isoDaysFromToday(-1),
      completedAt: isoDaysFromToday(-1),
      details: {
        gmb_handling: {
          businessName: 'Urban Bites Cafe',
          actionType: 'post_update',
          platform: 'Google Business Profile',
          notes: 'Published Q3 combo offer post and replied to 5 reviews (4 positive, 1 negative handled with resolution).',
        },
      },
    },
    {
      id: id('task'),
      title: 'Monthly GMB performance report',
      category: 'gmb_report',
      description: 'Compile views, calls and direction requests for June and share with the client.',
      clientName: 'Rohit Sharma',
      brandName: 'FitZone Gym',
      assignedDate: isoDaysFromToday(-2),
      dueDate: isoDaysFromToday(0),
      status: 'in_progress',
      priority: 'high',
      details: {
        gmb_report: {
          period: 'June 2026',
          views: 8420,
          searchQueries: 1260,
          calls: 94,
          directionRequests: 61,
          websiteClicks: 210,
          notes: 'Views up 12% MoM, driven by weekend search traffic.',
        },
      },
    },
    {
      id: id('task'),
      title: 'Build 10 quality backlinks for homepage',
      category: 'backlinks',
      description: 'Acquire relevant backlinks via guest posts and directories to strengthen domain authority.',
      clientName: 'Ananya Verma',
      brandName: 'NovaTech Solutions',
      assignedDate: isoDaysFromToday(-5),
      dueDate: isoDaysFromToday(2),
      status: 'in_progress',
      priority: 'high',
      details: {
        backlinks: [
          {
            id: id('bl'),
            sourceUrl: 'https://techinsights.com/guest/novatech-cloud-trends',
            targetUrl: 'https://novatechsolutions.com',
            anchorText: 'cloud migration experts',
            linkType: 'dofollow',
            placementType: 'guest_post',
            domainAuthority: 54,
            status: 'live',
          },
          {
            id: id('bl'),
            sourceUrl: 'https://bizdirectory.com/listing/novatech',
            targetUrl: 'https://novatechsolutions.com/services',
            anchorText: 'NovaTech Solutions',
            linkType: 'dofollow',
            placementType: 'directory',
            domainAuthority: 38,
            status: 'submitted',
          },
        ],
      },
    },
    {
      id: id('task'),
      title: 'Fix coverage errors flagged in Search Console',
      category: 'search_console',
      description: 'Resolve the 14 "crawled - currently not indexed" pages reported this week.',
      clientName: 'Divya Nair',
      brandName: 'GreenLeaf Organics',
      assignedDate: isoDaysFromToday(-4),
      dueDate: isoDaysFromToday(-2),
      status: 'blocked',
      priority: 'urgent',
      remarks: 'Blocked — waiting on dev team to fix duplicate canonical tags before resubmitting.',
      details: {
        search_console: {
          issueType: 'coverage_error',
          pagesAffected: 14,
          clicks: 1200,
          impressions: 45000,
          ctr: 2.6,
          avgPosition: 18.4,
          actionTaken: 'Identified duplicate canonical tags as root cause, ticket raised with dev team.',
        },
      },
    },
    {
      id: id('task'),
      title: 'Optimize product category page content',
      category: 'content_optimization',
      description: 'Improve on-page content for the "running shoes" category page to target primary keyword.',
      clientName: 'Karan Malhotra',
      brandName: 'StridePoint Footwear',
      assignedDate: isoDaysFromToday(-1),
      dueDate: isoDaysFromToday(1),
      status: 'pending',
      priority: 'medium',
      details: {
        content_optimization: {
          pageUrl: 'https://stridepoint.com/category/running-shoes',
          targetKeyword: 'best running shoes for men',
          changesMade: '',
          wordCount: 640,
          seoScoreBefore: 58,
          seoScoreAfter: '',
        },
      },
    },
    {
      id: id('task'),
      title: 'Keyword research for new blog vertical',
      category: 'keyword_research',
      description: 'Identify high-intent keywords for the upcoming "home fitness" content vertical.',
      clientName: 'Rohit Sharma',
      brandName: 'FitZone Gym',
      assignedDate: isoDaysFromToday(-6),
      dueDate: isoDaysFromToday(-3),
      status: 'completed',
      priority: 'low',
      submittedAt: isoDaysFromToday(-3),
      completedAt: isoDaysFromToday(-3),
      details: {
        keyword_research: [
          { id: id('kw'), keyword: 'home workout plan for beginners', searchVolume: 9900, difficulty: 34, intent: 'informational', tool: 'Ahrefs' },
          { id: id('kw'), keyword: 'best home gym equipment', searchVolume: 6600, difficulty: 42, intent: 'commercial', tool: 'Ahrefs' },
          { id: id('kw'), keyword: 'buy adjustable dumbbells online', searchVolume: 2400, difficulty: 29, intent: 'transactional', tool: 'SEMrush' },
        ],
      },
    },
    {
      id: id('task'),
      title: 'Full technical + on-page SEO audit',
      category: 'seo_audit',
      description: 'Run a complete audit ahead of the site relaunch and flag critical blockers.',
      clientName: 'Ananya Verma',
      brandName: 'NovaTech Solutions',
      assignedDate: isoDaysFromToday(-7),
      dueDate: isoDaysFromToday(-4),
      status: 'completed',
      priority: 'high',
      submittedAt: isoDaysFromToday(-4),
      completedAt: isoDaysFromToday(-4),
      details: {
        seo_audit: {
          website: 'https://novatechsolutions.com',
          auditType: 'full',
          issuesFound: 27,
          criticalIssues: 5,
          recommendations: 'Fix render-blocking scripts, add schema markup, consolidate thin content pages.',
        },
      },
    },
    {
      id: id('task'),
      title: 'Write blog: "10 SEO Trends for 2026"',
      category: 'blog_writing',
      description: 'Long-form article targeting "seo trends 2026" for the resources hub.',
      clientName: 'Divya Nair',
      brandName: 'GreenLeaf Organics',
      assignedDate: isoDaysFromToday(-2),
      dueDate: isoDaysFromToday(3),
      status: 'in_progress',
      priority: 'medium',
      details: {
        blog_writing: {
          blogTitle: '10 SEO Trends for 2026',
          targetKeyword: 'seo trends 2026',
          wordCount: 1450,
          publishStatus: 'in_review',
          publishUrl: '',
        },
      },
    },
    {
      id: id('task'),
      title: 'Track ranking movement for core keywords',
      category: 'website_ranking',
      description: 'Weekly rank check for the top 5 priority keywords across Google desktop and mobile.',
      clientName: 'Karan Malhotra',
      brandName: 'StridePoint Footwear',
      assignedDate: isoDaysFromToday(-1),
      dueDate: isoDaysFromToday(0),
      status: 'in_progress',
      priority: 'medium',
      details: {
        website_ranking: [
          { id: id('rk'), keyword: 'best running shoes for men', searchEngine: 'google', device: 'mobile', previousRank: 14, currentRank: 9, url: 'https://stridepoint.com/category/running-shoes' },
          { id: id('rk'), keyword: 'lightweight running shoes', searchEngine: 'google', device: 'desktop', previousRank: 22, currentRank: 25, url: 'https://stridepoint.com/category/running-shoes' },
          { id: id('rk'), keyword: 'stridepoint running shoes review', searchEngine: 'google', device: 'mobile', previousRank: 6, currentRank: 3, url: 'https://stridepoint.com' },
        ],
      },
    },
    {
      id: id('task'),
      title: 'Refresh title tags and meta descriptions',
      category: 'on_page_seo',
      description: 'Rewrite title tags and meta descriptions for the 8 highest-traffic landing pages.',
      clientName: 'Meera Kapoor',
      brandName: 'Urban Bites Cafe',
      assignedDate: isoDaysFromToday(0),
      dueDate: isoDaysFromToday(4),
      status: 'pending',
      priority: 'low',
      details: {
        on_page_seo: {
          pageUrl: 'https://urbanbitescafe.com/menu',
          elementsUpdated: [],
          notes: '',
        },
      },
    },
    {
      id: id('task'),
      title: 'Guest posting outreach for off-page authority',
      category: 'off_page_seo',
      description: 'Reach out to 15 relevant food & lifestyle blogs for guest posting opportunities.',
      clientName: 'Meera Kapoor',
      brandName: 'Urban Bites Cafe',
      assignedDate: isoDaysFromToday(-3),
      dueDate: isoDaysFromToday(-1),
      status: 'in_progress',
      priority: 'medium',
      details: {
        off_page_seo: {
          activityType: 'guest_posting',
          website: '',
          linksBuilt: 3,
          notes: '3 guest posts confirmed so far, 12 outreach emails still awaiting response.',
        },
      },
    },
    {
      id: id('task'),
      title: 'Improve Core Web Vitals score',
      category: 'technical_seo',
      description: 'Site speed and LCP issues are hurting mobile rankings — investigate and fix.',
      clientName: 'Rohit Sharma',
      brandName: 'FitZone Gym',
      assignedDate: isoDaysFromToday(-6),
      dueDate: isoDaysFromToday(-5),
      status: 'blocked',
      priority: 'urgent',
      remarks: 'Waiting on hosting upgrade approval to enable image CDN.',
      details: {
        technical_seo: {
          issueType: 'site_speed',
          pageUrl: 'https://fitzonegym.com',
          status: 'in_progress',
          notes: 'LCP at 4.2s on mobile, mainly due to unoptimized hero images.',
        },
      },
    },
    {
      id: id('task'),
      title: 'Add FAQ schema markup to service pages',
      category: 'technical_seo',
      description: 'Implement FAQPage structured data on the top 6 service pages for rich snippets.',
      clientName: 'Ananya Verma',
      brandName: 'NovaTech Solutions',
      assignedDate: isoDaysFromToday(1),
      dueDate: isoDaysFromToday(6),
      status: 'pending',
      priority: 'low',
      details: {
        technical_seo: {
          issueType: 'schema_markup',
          pageUrl: 'https://novatechsolutions.com/services',
          status: 'identified',
          notes: '',
        },
      },
    },
  ];
}

export function buildDummyAdditionalTasks(): AdditionalTask[] {
  return [
    {
      id: id('add'),
      title: 'Helped onboard a new client website in GSC',
      category: 'search_console',
      description: 'Verified domain ownership and submitted the initial sitemap for a new client outside the assigned task list.',
      date: isoDaysFromToday(-2),
      hoursSpent: 1.5,
      outcome: 'Property verified, sitemap submitted, 0 crawl errors on first pass.',
      createdAt: new Date().toISOString(),
    },
    {
      id: id('add'),
      title: 'Competitor backlink gap analysis',
      category: 'backlinks',
      description: 'Ran a quick competitor comparison to spot backlink opportunities we were missing for StridePoint.',
      date: isoDaysFromToday(-1),
      hoursSpent: 2,
      outcome: 'Found 6 realistic link targets, shared list with the team lead.',
      createdAt: new Date().toISOString(),
    },
  ];
}
