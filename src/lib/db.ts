import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const DB_DIR = isServerless ? '/tmp' : path.join(process.cwd(), 'data');

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch {
    // directory may already exist or cannot be created
  }
}

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'leadforge.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      website TEXT NOT NULL,
      industry TEXT DEFAULT 'Technology',
      location TEXT DEFAULT 'Global',
      contact_name TEXT,
      contact_title TEXT,
      contact_email TEXT,
      contact_linkedin TEXT,
      estimated_revenue TEXT,
      employee_count TEXT,
      icp_score INTEGER DEFAULT 75,
      pain_points TEXT, -- JSON array
      tech_stack TEXT,  -- JSON array
      summary TEXT,
      status TEXT DEFAULT 'discovered', -- discovered, enriched, pitched, replied, converted, archived
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pitches (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL, -- cold_email, linkedin_dm, follow_up, call_script
      subject TEXT,
      content TEXT NOT NULL,
      tone TEXT DEFAULT 'conversational',
      value_prop TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default settings and sample leads if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM leads');
  const leadCount = (countStmt.get() as { count: number }).count;

  if (leadCount === 0) {
    seedDefaultData(db);
  }

  // Ensure default credits exist
  const checkCredits = db.prepare("SELECT value FROM user_settings WHERE key = 'credits'").get();
  if (!checkCredits) {
    db.prepare("INSERT INTO user_settings (key, value) VALUES ('credits', '125')").run();
    db.prepare("INSERT INTO user_settings (key, value) VALUES ('tier', 'Growth Plan')").run();
    db.prepare("INSERT INTO user_settings (key, value) VALUES ('offer_description', 'We build autonomous AI agents that eliminate repetitive manual workflows and 10x sales outreach response rates.')").run();
  }
}

function seedDefaultData(db: Database.Database) {
  const insertLead = db.prepare(`
    INSERT INTO leads (
      id, company_name, website, industry, location,
      contact_name, contact_title, contact_email, contact_linkedin,
      estimated_revenue, employee_count, icp_score, pain_points, tech_stack,
      summary, status
    ) VALUES (
      @id, @company_name, @website, @industry, @location,
      @contact_name, @contact_title, @contact_email, @contact_linkedin,
      @estimated_revenue, @employee_count, @icp_score, @pain_points, @tech_stack,
      @summary, @status
    )
  `);

  const initialLeads = [
    {
      id: 'lead_01',
      company_name: 'HyperScale Cloud',
      website: 'https://hyperscale.example.com',
      industry: 'Cloud Infrastructure & DevOps',
      location: 'San Francisco, CA',
      contact_name: 'Marcus Vance',
      contact_title: 'VP of Growth & Revenue',
      contact_email: 'marcus.vance@hyperscale.example.com',
      contact_linkedin: 'https://linkedin.com/in/marcus-vance-cloud',
      estimated_revenue: '$15M - $25M ARR',
      employee_count: '85-120',
      icp_score: 94,
      pain_points: JSON.stringify([
        'High sales cycle duration (over 90 days for mid-market)',
        'Difficulty identifying high-intent engineering leads before competitors',
        'Manual SDR prospecting taking 15+ hours weekly per rep'
      ]),
      tech_stack: JSON.stringify(['AWS', 'Kubernetes', 'HubSpot', 'Segment', 'Next.js', 'Stripe']),
      summary: 'High-growth cloud container management platform experiencing rapid customer acquisition but facing bottlenecks in outbound SDR efficiency.',
      status: 'enriched'
    },
    {
      id: 'lead_02',
      company_name: 'FinFlow Global',
      website: 'https://finflow.example.com',
      industry: 'B2B FinTech & Payments',
      location: 'New York, NY',
      contact_name: 'Elena Rostova',
      contact_title: 'Head of Business Development',
      contact_email: 'elena@finflow.example.com',
      contact_linkedin: 'https://linkedin.com/in/elena-rostova-fintech',
      estimated_revenue: '$30M - $50M ARR',
      employee_count: '210',
      icp_score: 89,
      pain_points: JSON.stringify([
        'Low open and conversion rates from generic cold email outreach',
        'Cross-border compliance paperwork slowing down client onboarding',
        'Need for tailored executive messaging targeting CFOs'
      ]),
      tech_stack: JSON.stringify(['PostgreSQL', 'Salesforce', 'React', 'Intercom', 'Plaid']),
      summary: 'Cross-border payment automation platform serving global e-commerce merchants and enterprise marketplaces.',
      status: 'discovered'
    },
    {
      id: 'lead_03',
      company_name: 'TalentPeak HR',
      website: 'https://talentpeak.example.com',
      industry: 'HRTech & Talent Acquisition',
      location: 'Austin, TX',
      contact_name: 'Jordan Miller',
      contact_title: 'Founder & CEO',
      contact_email: 'jordan@talentpeak.example.com',
      contact_linkedin: 'https://linkedin.com/in/jordan-miller-talent',
      estimated_revenue: '$4M - $8M ARR',
      employee_count: '42',
      icp_score: 91,
      pain_points: JSON.stringify([
        'Relying purely on inbound referrals with inconsistent monthly pipeline',
        'Need automated persona-based pitch customization for tech recruiter leads',
        'Budget constraints limiting full-time sales headcount'
      ]),
      tech_stack: JSON.stringify(['Next.js', 'TailwindCSS', 'Notion', 'Zapier', 'Apollo.io']),
      summary: 'AI-driven candidate screening tool targeting tech hiring managers with high ICP alignment for outbound automation.',
      status: 'pitched'
    }
  ];

  for (const lead of initialLeads) {
    insertLead.run(lead);
  }

  // Pre-seed a pitch for lead_03
  const insertPitch = db.prepare(`
    INSERT INTO pitches (id, lead_id, type, subject, content, tone, value_prop)
    VALUES (@id, @lead_id, @type, @subject, @content, @tone, @value_prop)
  `);

  insertPitch.run({
    id: 'pitch_01',
    lead_id: 'lead_03',
    type: 'cold_email',
    subject: 'Quick question regarding TalentPeak outbound pipeline',
    content: `Hi Jordan,

Noticed TalentPeak has been scaling candidate screening for tech teams—congrats on the recent momentum.

Most HRTech founders we chat with mention that relying heavily on inbound leaves monthly pipeline volatile, especially when full-time SDRs are expensive to ramp.

We built an autonomous outreach system that enriches high-intent hiring managers and crafts hyper-personalized pitches on autopilot, booking 12-18 qualified demos/month on average.

Would you be open to a 5-minute brief run-through this Thursday to see how it works for TalentPeak?

Best,
Alex Rivers | Growth Lead`,
    tone: 'concise and consultative',
    value_prop: 'Automate outbound prospecting to book qualified demos predictably without hiring more sales reps.'
  });

  // Pre-seed an activity log
  db.prepare(`
    INSERT INTO activity_logs (id, action, details)
    VALUES ('log_01', 'Lead Enriched', 'AI Deep Analysis completed for HyperScale Cloud (ICP Score: 94)')
  `).run();
}
