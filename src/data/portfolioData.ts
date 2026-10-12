import {
  FontPairOption,
  ProjectItem,
  AdCampaignItem,
  ExperienceItem,
  TicketItem,
  PortfolioInfo,
} from '../types';

import profileImg from '../assets/images/profile_editorial_portrait_1791718263477.jpg';
import orderbixImg from '../assets/images/project_orderbix_hero_1791718276829.jpg';
import sixthloomImg from '../assets/images/project_sixthloom_hero_1791718287665.jpg';
import adsDashboardImg from '../assets/images/ads_meta_dashboard_1791718299781.jpg';
import ayurvedaImg from '../assets/images/project_ayurveda_hero_1791718311030.jpg';

export const FONT_PAIRS: FontPairOption[] = [
  {
    id: 'anton-jakarta',
    name: 'Geometric Headline / Modern Sans',
    headlineFont: 'Anton',
    headlineClass: 'font-anton uppercase tracking-wider',
    bodyFont: 'Plus Jakarta Sans',
    bodyClass: 'font-jakarta',
    description: 'Crisp bold agency typography with balanced sans body'
  },
  {
    id: 'syne-mono',
    name: 'Avant-Garde Syne / High-Tech Mono',
    headlineFont: 'Syne',
    headlineClass: 'font-syne font-extrabold tracking-tight',
    bodyFont: 'JetBrains Mono',
    bodyClass: 'font-mono-code',
    description: 'Futuristic developer aesthetic with mono text readability'
  },
  {
    id: 'space-mono',
    name: 'Space Grotesk / Code Mono',
    headlineFont: 'Space Grotesk',
    headlineClass: 'font-space font-bold tracking-tight',
    bodyFont: 'JetBrains Mono',
    bodyClass: 'font-mono-code',
    description: 'Clean high-density technical developer layout'
  },
  {
    id: 'cinzel-jakarta',
    name: 'Modern Editorial Serif / Sans',
    headlineFont: 'Cinzel',
    headlineClass: 'font-cinzel font-bold tracking-widest uppercase',
    bodyFont: 'Plus Jakarta Sans',
    bodyClass: 'font-jakarta',
    description: 'Monochrome luxury monograph aesthetic with crisp sans'
  }
];

export const INITIAL_PORTFOLIO_INFO: PortfolioInfo = {
  personaName: 'MORGANDEMAXWEL',
  realName: 'SRIKANTH SR',
  roleTitle: 'CREATIVE DEVELOPER / ADS STRATEGIST',
  location: 'Kulasekharam, Kanyakumari, India (Open to UAE & Global Relocation)',
  email: 'srsrikanth216@gmail.com',
  phone: '+91 78250 25164',
  whatsapp: '+91 78250 25164',
  linkedin: 'linkedin.com/in/srsrikanth',
  githubPortfolioUrl: 'srikanthsr21.github.io/digital-marketing-portfolio',
  instagram: 'https://instagram.com',
  resumeUrl: '',
  aboutBio:
    'Creative and results-driven Digital Marketing Executive & Developer with hands-on experience orchestrating multi-channel social growth (Instagram, Facebook, LinkedIn), Meta & Google Ads conversion architectures, and high-performance web storefronts. Spearheaded in-house brand rollouts for CyberBix Technologies (Orderbix, Storebix, 6thLoom), grew brand followings by 5,000+ via single viral giveaway campaigns, and ranked 4 client websites to top Google search rankings. Combines a Master of Arts in English with strong analytical copywriting and Python/Django technical acumen.',
  skills: [
    {
      category: 'Paid Advertising & Acquisition',
      items: [
        'Google Ads Search & Display',
        'Meta Ads Manager (Facebook & Instagram)',
        'Performance Marketing & Lead-Gen',
        'ROAS Optimization & Scaling',
        'Conversion Tracking & GA4'
      ]
    },
    {
      category: 'Organic Growth & SEO',
      items: [
        'Keyword Architecture & Research',
        'Technical On-Page & Off-Page SEO',
        'Google Search Console & GA4',
        'Competitor Analysis (Semrush, Ahrefs, Moz)',
        'Local SEO & Google Business Profiles'
      ]
    },
    {
      category: 'Creative Direction & Strategy',
      items: [
        'Content Calendars & Viral Giveaways',
        'Ad Copywriting & Script Architecture',
        'Canva & High-Impact Carousels',
        'Brand Guidelines & Design Systems',
        'AI-Assisted Visual Prompt Engineering'
      ]
    },
    {
      category: 'Development & Tools',
      items: [
        'Full-Stack Web (Python & Django)',
        'Modern Responsive UI & Tailwind CSS',
        'E-Commerce Storefront Systems',
        'MS Office Suite & Advanced Reporting',
        'Cross-Functional Design & Sales Sync'
      ]
    }
  ],
  education: [
    {
      degree: 'Master of Arts (MA) in English',
      institution: 'Vivekananda College, Agasteeswaram, Kanyakumari',
      year: '2021'
    },
    {
      degree: 'Bachelor of Arts (BA) in English',
      institution: 'Vivekananda College, Agasteeswaram, Kanyakumari',
      year: '2019'
    }
  ],
  certifications: [
    'Certified Digital Marketing Specialist — DigitalX Marketers Academy (2025): SEO, SEM, Meta Ads, Google Analytics, SMM, Performance Marketing'
  ]
};

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'proj-orderbix',
    title: 'ORDERBIX SOCIAL STOREFRONT',
    client: 'CyberBix Technologies',
    category: 'E-Commerce Platform',
    role: 'Lead Strategist & UI Direction',
    shortDesc: 'End-to-end go-to-market architecture and social-seller storefront web app with seamless checkout analytics.',
    fullDesc: 'Architected the launch strategy for Orderbix, a cutting-edge social commerce storefront designed for Instagram creators and boutique brands. Directed messaging hierarchy, trial-offer outreach sequences, and converted 350+ social sellers within the first 60 days.',
    heroImage: orderbixImg,
    liveUrl: 'https://orderbix.com',
    year: '2026',
    tags: ['E-Commerce', 'GTM Strategy', 'UI/UX', 'Conversion Optimization'],
    metrics: '+350 Onboarded Stores · 4.2x ROAS on Launch'
  },
  {
    id: 'proj-sixthloom',
    title: '6THLOOM LUXURY TEXTILES',
    client: '6thLoom Heritage',
    category: 'Artisanal Direct-To-Consumer',
    role: 'Brand Building & Meta Strategy',
    shortDesc: 'High-end handcrafted textile brand website and viral Facebook page campaign scaling to 5,000+ followers.',
    fullDesc: 'Established 6thLoom from zero brand presence into a recognized artisanal luxury textile label. Structured the full content calendar, brand styleguide, and planned a single viral giveaway contest that generated 5,000+ targeted followers in under 14 days.',
    heroImage: sixthloomImg,
    liveUrl: 'https://6thloom.com',
    year: '2026',
    tags: ['Luxury E-Commerce', 'Viral Growth', 'Meta Ads', 'Brand Identity'],
    metrics: '+5,000 Verified Followers · 32% Engagement Rate'
  },
  {
    id: 'proj-desert-ayurveda',
    title: 'DESERT AYURVEDA SHARJAH',
    client: 'Desert Ayurveda UAE',
    category: 'International Healthcare & Wellness',
    role: 'International SEO & Content Lead',
    shortDesc: 'International market localization, high-intent local SEO, and Google Business Profile ranking in the UAE.',
    fullDesc: 'Managed cross-border digital content standards and technical SEO architecture for Desert Ayurveda based in Sharjah, UAE. Ranked high-competition medical keywords in the top 3 spots in Google UAE search, scaling appointment bookings by 85%.',
    heroImage: ayurvedaImg,
    liveUrl: 'https://desertayurveda.ae',
    year: '2026',
    tags: ['UAE Market', 'International SEO', 'Google Business', 'Healthcare'],
    metrics: '#1-#3 Search Rankings in UAE · +85% Bookings'
  },
  {
    id: 'proj-storebix',
    title: 'STOREBIX CLOUD COMMERCE',
    client: 'CyberBix Technologies',
    category: 'SaaS Platform',
    role: 'Positioning & Tier Pricing Strategy',
    shortDesc: 'Modern cloud commerce tier pricing structure and interactive developer feature documentation.',
    fullDesc: 'Structured value propositions and feature tier pricing models for Storebix enterprise cloud merchants. Created visual carousel architecture, promotional trial funnels, and collaborative creative direction for multi-tier plan subscriptions.',
    heroImage: orderbixImg,
    liveUrl: 'https://storebix.com',
    year: '2026',
    tags: ['SaaS Growth', 'Pricing Architecture', 'Content Funnel'],
    metrics: '68.4% Checkout Funnel Conversion Rate'
  }
];

export const AD_CAMPAIGNS_DATA: AdCampaignItem[] = [
  {
    id: 'ad-meta-sixthloom',
    title: 'META ADS SCALING — 6THLOOM VIRAL ACQUISITION',
    clientBrand: '6thLoom / CyberBix',
    platform: 'Meta Ads',
    metricHeadline: '5,000+ Instagram & FB Followers with 4.2x ROAS',
    summary: 'Executed strategic Meta Ads Manager audience funnels leveraging high-performing aesthetic video carousels and giveaway lead forms.',
    hasScreenshot: true,
    screenshotImage: adsDashboardImg,
    achievements: [
      'Engineered multi-stage custom & lookalike audiences across lifestyle shoppers.',
      'Achieved $0.18 cost-per-acquisition on giveaway viral signups.',
      'Maintained 4.2x average ROAS across first 30 days of DTC storefront launch.'
    ],
    keyStats: [
      { label: 'Followers Gained', value: '+5,200' },
      { label: 'Blended ROAS', value: '4.2x' },
      { label: 'Avg CPC', value: '$0.24' },
      { label: 'Reach', value: '184,000+' }
    ]
  },
  {
    id: 'ad-google-foreway',
    title: 'GOOGLE ADS SEARCH OPTIMIZATION — FOREWAY REALTORS',
    clientBrand: 'Foreway Realtors',
    platform: 'Google Ads',
    metricHeadline: '+38% Click-Through Rate & 24% Slashed CPA',
    summary: 'Restructured hyper-competitive residential real estate search campaigns with negative keyword trees and high-intent landing page routing.',
    hasScreenshot: false,
    achievements: [
      'Eliminated broad match bleed, recovering 32% of wasted monthly ad budget.',
      'Engineered localized ad extensions and responsive search ad (RSA) variants.',
      'Drove 140+ qualified luxury property consultation calls within 45 days.'
    ],
    keyStats: [
      { label: 'CTR Increase', value: '+38%' },
      { label: 'CPA Reduction', value: '-24%' },
      { label: 'Quality Score', value: '9/10' },
      { label: 'Qualified Inquiries', value: '142' }
    ]
  },
  {
    id: 'ad-meta-shajina',
    title: 'META ADS PATIENT ACQUISITION — SHAJINA MEDICAL CENTRE',
    clientBrand: 'Shajina Medical',
    platform: 'Meta Ads',
    metricHeadline: '210+ Monthly Healthcare Appointments Generated',
    summary: 'Geo-targeted lead generation campaigns for specialized clinical consultation and dental checkups with instant messaging integration.',
    hasScreenshot: true,
    screenshotImage: adsDashboardImg,
    achievements: [
      'Targeted 15km clinical radius with localized multi-lingual ad copy.',
      'Integrated direct WhatsApp booking link inside Meta Instant Experience cards.',
      'Decreased patient acquisition cost by 41% compared to regional industry average.'
    ],
    keyStats: [
      { label: 'Monthly Leads', value: '210+' },
      { label: 'Lead-to-Patient', value: '46%' },
      { label: 'Cost Per Lead', value: '$2.15' },
      { label: 'Geographic Radius', value: '15 km' }
    ]
  },
  {
    id: 'ad-seo-rankings',
    title: 'SERP DOMINANCE — 4 CLIENT SITES RANKED IN TOP POSITIONS',
    clientBrand: 'Markwizard Global Clients',
    platform: 'SEO & SEM',
    metricHeadline: '4 Client Websites Ranked #1-#3 on High-Volume Keywords',
    summary: 'Comprehensive technical on-page audits, schema markup implementation, and strategic semantic content siloing across competitive sectors.',
    hasScreenshot: false,
    achievements: [
      'Conducted deep keyword intent grouping across 1,200+ target search terms.',
      'Implemented Core Web Vitals optimizations boosting mobile pagespeed to 96+.',
      'Secured organic snippet placement for 28 high-conversion commercial queries.'
    ],
    keyStats: [
      { label: 'Top 3 Rankings', value: '4 Websites' },
      { label: 'Organic Traffic', value: '+192%' },
      { label: 'Tracked Keywords', value: '1,200+' },
      { label: 'Featured Snippets', value: '28' }
    ]
  }
];

export const CLIENT_LOGOS = [
  { name: 'CYBERBIX', symbol: 'CB' },
  { name: 'ORDERBIX', symbol: 'OX' },
  { name: 'STOREBIX', symbol: 'SB' },
  { name: '6THLOOM', symbol: '6L' },
  { name: 'DESERT AYURVEDA', symbol: 'DA' },
  { name: 'MARKWIZARD', symbol: 'MW' },
  { name: 'BLUEPIN DIGITAL', symbol: 'BP' },
  { name: 'UNIGRANDT', symbol: 'UG' },
  { name: 'FOREWAY REALTORS', symbol: 'FR' },
  { name: 'SHAJINA MEDICAL', symbol: 'SM' },
  { name: 'NIKE CORP', symbol: 'NK' },
  { name: 'APPLE ECOSYSTEM', symbol: 'AP' },
  { name: 'COCA-COLA', symbol: 'CC' }
];

export const WORK_EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: 'exp-cyberbix',
    role: 'Digital Marketing Executive',
    company: 'CyberBix Technologies',
    period: 'Jul 2026 – Present',
    location: 'India',
    isCurrent: true,
    summary: 'Directing end-to-end digital acquisition and content strategy for 3 core in-house brands: Orderbix, Storebix, and 6thLoom.',
    achievements: [
      'Established and scaled the 6thLoom Facebook Page, designing an integrated giveaway that drove 5,000+ targeted followers.',
      'Engineered go-to-market content plans for Orderbix (Instagram social storefront app) with trial funnels and social proof.',
      'Crafted value messaging and tier pricing structures for Storebix enterprise features.',
      'Authored brand guidelines (palette, typography hierarchy, carousel layout) and AI-assisted visual prompt workflows for Bix Ecom.'
    ]
  },
  {
    id: 'exp-markwizard',
    role: 'Digital Marketing Executive',
    company: 'Markwizard Global',
    period: 'Jan 2026 – Jun 2026',
    location: 'Remote / Global',
    summary: 'Led organic search engine ranking, social accounts management, and paid Meta campaigns for international clients.',
    achievements: [
      'Propelled 4 client websites to top search positions via keyword architecture and technical on-page SEO.',
      'Managed 7 social media brand accounts simultaneously, ensuring daily content cadence, voice consistency, and community growth.',
      'Architected and executed Meta (Facebook & Instagram) paid campaigns to generate verified high-intent leads.',
      'Spearheaded international content & Google Business optimization for UAE client Desert Ayurveda (Sharjah).'
    ]
  },
  {
    id: 'exp-bluepin',
    role: 'Digital Marketing Intern',
    company: 'Bluepin Digital',
    period: 'Nov 2025',
    location: 'India',
    summary: 'Assisted in execution of full-funnel SEO, SEM, and SMM campaigns for educational and medical brands.',
    achievements: [
      'Executed SEO and Google Search campaigns for Unigrandt Institute.',
      'Managed live Meta Ads for Shajina Medical Centre and live Google Ads for Foreway Realtors.',
      'Produced multi-format social content, blogs, and ad creatives boosting brand recognition.'
    ]
  },
  {
    id: 'exp-mysearch',
    role: 'Marketing Intern',
    company: 'MySearch Global Rewards',
    period: '2025',
    location: 'India',
    summary: 'Supported digital campaigns, customer rewards marketing, Meta Ads execution, and SEO research tasks.',
    achievements: [
      'Aided ad targeting setups and keyword competitive benchmarking.',
      'Built performance tracking spreadsheets and daily conversion logs.'
    ]
  }
];

export const INITIAL_TICKETS: TicketItem[] = [
  {
    id: 'TCK-1092',
    clientName: 'Julian Vance',
    clientEmail: 'julian@vanceatelier.com',
    message: 'Need high-converting Meta Ads setup and Shopify landing page redesign for luxury fashion brand.',
    service: 'Meta Ads & Storefront',
    budget: '$3,500 - $5,000',
    status: 'In Progress',
    date: '2026-10-10'
  },
  {
    id: 'TCK-1091',
    clientName: 'Dr. Mariam Al-Mansoor',
    clientEmail: 'dr.mariam@desertwellness.ae',
    message: 'SEO audit and Google Business Profile optimization for new medical branch in Dubai Marina.',
    service: 'UAE Healthcare SEO',
    budget: '$2,000 / month',
    status: 'In Review',
    date: '2026-10-09'
  },
  {
    id: 'TCK-1090',
    clientName: 'Karthik Raja',
    clientEmail: 'karthik@bixcommerce.io',
    message: 'Review 6thLoom Q4 giveaway content calendar and finalize paid ad budget allocation.',
    service: 'CyberBix Brand Strategy',
    budget: 'Internal Sprint',
    status: 'New',
    date: '2026-10-08'
  },
  {
    id: 'TCK-1088',
    clientName: 'Sarah Jenkins',
    clientEmail: 's.jenkins@forewayrealty.com',
    message: 'Google Ads Search CTR increased by 38% last month. Ready to scale daily budget by 50%.',
    service: 'Google Ads Optimization',
    budget: '$6,000 / month',
    status: 'Resolved',
    date: '2026-10-04'
  }
];

export const GITHUB_DEPLOY_STATUS = {
  repoName: 'srikanthsr21/digital-marketing-portfolio',
  statusText: 'DEPLOYED TO GITHUB / PRODUCTION VERIFIED',
  branch: 'main',
  lastCommitHash: '7f9c2a1',
  commitMessage: 'feat(portfolio): sleek B&W ultra-minimalist layout & WhatsApp direct routing',
  deployedUrl: 'https://srikanthsr21.github.io/digital-marketing-portfolio',
  nodeEnv: 'production (Vite + React 19)',
  buildCheck: 'PASSING (Zero Errors)',
  starsCount: 142,
  forksCount: 38
};
