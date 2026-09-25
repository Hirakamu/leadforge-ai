import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScrapedCompanyData } from './scraper';

export interface EnrichedResult {
  company_name: string;
  industry: string;
  location: string;
  summary: string;
  estimated_revenue: string;
  employee_count: string;
  icp_score: number;
  pain_points: string[];
  tech_stack: string[];
  target_buyer_persona: string;
  recommended_angle: string;
}

export interface GeneratedPitchResult {
  subject: string;
  content: string;
  value_prop: string;
}

export async function enrichCompanyData(
  companyName: string,
  website: string,
  scraped: ScrapedCompanyData,
  userOffer?: string,
  apiKey?: string
): Promise<EnrichedResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (key) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are an expert B2B SaaS Sales Intelligence and Lead Enrichment Agent.
Analyze the following scraped company data and evaluate how well they fit as a potential customer.

Company Name: ${companyName}
Website: ${website}
Page Title: ${scraped.title}
Meta Description: ${scraped.description}
Headings: ${scraped.headings.join(' | ')}
Detected Tech: ${scraped.detectedTech.join(', ')}
Website Excerpt: ${scraped.rawTextSnippet}
Our Offering: ${userOffer || 'High-performance AI automation, custom software, and sales conversion pipelines.'}

Respond ONLY with a valid JSON object with the following schema:
{
  "company_name": "${companyName}",
  "industry": "Specific Industry Name",
  "location": "Estimated or standard headquarters location",
  "summary": "2-3 concise sentences summarizing their business model, primary value prop, and customer focus",
  "estimated_revenue": "$X - $Y ARR or Annual Revenue",
  "employee_count": "Estimated employee range e.g. 50-150",
  "icp_score": 85, // Integer 1-100 indicating ICP match for B2B tech/sales outreach
  "pain_points": [
    "Specific pain point 1 related to scaling, operations, or tech bottlenecks",
    "Specific pain point 2",
    "Specific pain point 3"
  ],
  "tech_stack": ["Tech1", "Tech2", "Tech3"],
  "target_buyer_persona": "Exact job title to target (e.g. VP of Sales, Head of Engineering, Founder)",
  "recommended_angle": "The most compelling high-converting hook angle to pitch them"
}
`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned) as EnrichedResult;
      return parsed;
    } catch (err) {
      console.warn('Gemini API call failed, falling back to intelligent rule-based enrichment:', err);
    }
  }

  // High-quality rule-based heuristic enrichment fallback
  return generateHeuristicEnrichment(companyName, website, scraped, userOffer);
}

function generateHeuristicEnrichment(
  companyName: string,
  website: string,
  scraped: ScrapedCompanyData,
  userOffer?: string
): EnrichedResult {
  const desc = (scraped.description + ' ' + scraped.title + ' ' + scraped.rawTextSnippet).toLowerCase();
  
  let industry = 'B2B Software & Cloud Services';
  let estimatedRev = '$5M - $15M ARR';
  let empCount = '40 - 120';
  let icpScore = 88;
  let buyerPersona = 'VP of Growth / Founder';

  if (desc.includes('ecommerce') || desc.includes('shop') || desc.includes('retail') || scraped.detectedTech.includes('Shopify')) {
    industry = 'E-Commerce & DTC Brands';
    estimatedRev = '$10M - $30M GMV';
    empCount = '25 - 80';
    icpScore = 91;
    buyerPersona = 'Head of E-Commerce / Chief Marketing Officer';
  } else if (desc.includes('finance') || desc.includes('payment') || desc.includes('banking') || desc.includes('invest')) {
    industry = 'FinTech & Financial Services';
    estimatedRev = '$20M - $60M ARR';
    empCount = '100 - 300';
    icpScore = 93;
    buyerPersona = 'VP of Product / Head of Compliance & Operations';
  } else if (desc.includes('health') || desc.includes('medical') || desc.includes('clinic')) {
    industry = 'HealthTech & Digital Health';
    estimatedRev = '$8M - $25M ARR';
    empCount = '50 - 150';
    icpScore = 86;
    buyerPersona = 'Chief Operating Officer / VP of Technology';
  } else if (desc.includes('agency') || desc.includes('consulting') || desc.includes('marketing')) {
    industry = 'Digital Agency & Professional Services';
    estimatedRev = '$2M - $6M Annual Revenue';
    empCount = '15 - 45';
    icpScore = 89;
    buyerPersona = 'Managing Partner / Agency Founder';
  }

  const painPoints = [
    `Scaling sales pipeline without inflating customer acquisition cost (CAC)`,
    `Manual lead qualification and data enrichment slowing down sales velocity`,
    `Standing out from market competitors with personalized, multi-channel buyer touchpoints`
  ];

  const mergedTech = Array.from(new Set([...scraped.detectedTech, 'Cloud Services', 'Modern Web Stack']));

  return {
    company_name: companyName,
    industry,
    location: 'United States (Hybrid/Remote)',
    summary: scraped.description || `${companyName} delivers specialized digital solutions, optimizing operational workflows and driving revenue growth for modern clients.`,
    estimated_revenue: estimatedRev,
    employee_count: empCount,
    icp_score: icpScore,
    pain_points: painPoints,
    tech_stack: mergedTech.slice(0, 6),
    target_buyer_persona: buyerPersona,
    recommended_angle: `Highlight how automation reduces overhead while increasing pipeline consistency for ${industry} teams.`
  };
}

export async function generateOutreachPitch(
  lead: {
    company_name: string;
    website: string;
    industry?: string;
    contact_name?: string;
    contact_title?: string;
    summary?: string;
    pain_points?: string[];
    tech_stack?: string[];
  },
  userOffer: string,
  tone: string = 'conversational',
  pitchType: 'cold_email' | 'linkedin_dm' | 'follow_up' | 'call_script' = 'cold_email',
  apiKey?: string
): Promise<GeneratedPitchResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  const firstName = lead.contact_name ? lead.contact_name.split(' ')[0] : 'there';
  const role = lead.contact_title || 'Leader';

  if (key) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are a world-class B2B copywriter with a track record of generating 30%+ cold response rates.
Write a personalized ${pitchType.replace('_', ' ')} for:

Target Prospect: ${lead.contact_name || 'Prospect'} (${role}) at ${lead.company_name}
Industry: ${lead.industry || 'Tech'}
Company Overview: ${lead.summary || 'Modern enterprise'}
Identified Pain Points: ${(lead.pain_points || []).join('; ')}
Tech Stack: ${(lead.tech_stack || []).join(', ')}
Our Value Proposition / Product: ${userOffer}
Requested Tone: ${tone} (e.g., consultative, direct, conversational, witty)

Format:
- If 'cold_email': Subject line (<6 words, curiosity-driven, no spam words) + email body under 120 words with clear low-friction CTA (e.g. 5-min intro call or feedback).
- If 'linkedin_dm': Connection note under 280 characters, crisp and genuine.
- If 'follow_up': A polite, high-value day-3 bump email referencing the previous message with an additional insight.
- If 'call_script': A 60-second cold call framework: Pattern interrupt -> Problem statement -> Value prop -> Soft ask for meeting.

Respond ONLY with valid JSON:
{
  "subject": "Subject line (or N/A for LinkedIn DM/Call script)",
  "content": "Full message text with proper formatting and line breaks",
  "value_prop": "1-sentence summary of the core angle used in this pitch"
}
`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as GeneratedPitchResult;
    } catch (err) {
      console.warn('Gemini pitch generation failed, falling back to dynamic template:', err);
    }
  }

  // Dynamic high-converting template engine
  if (pitchType === 'linkedin_dm') {
    return {
      subject: `Connecting with ${firstName} @ ${lead.company_name}`,
      content: `Hi ${firstName}, loved your work steering ${lead.company_name}'s growth in ${lead.industry || 'the tech space'}. We recently developed an autonomous pipeline helping ${lead.industry || 'teams'} eliminate manual outreach bottlenecks. Would love to connect and exchange notes!`,
      value_prop: `High-context networking hook emphasizing leadership at ${lead.company_name}.`
    };
  }

  if (pitchType === 'follow_up') {
    return {
      subject: `Re: Quick thought on ${lead.company_name} pipeline`,
      content: `Hi ${firstName},

Circling back quickly on my previous note. 

Given ${lead.company_name}'s current expansion, I know your calendar is packed. We recently helped a peer in ${lead.industry || 'B2B'} boost sales qualified meetings by 42% in under 30 days without adding SDR headcount.

Would it make sense to take a 5-minute look at how the workflow runs, or are you all set for this quarter?

Best regards,
Outreach Team`,
      value_prop: `Proof-driven follow-up with a zero-friction question to re-engage prospect.`
    };
  }

  if (pitchType === 'call_script') {
    return {
      subject: `60-Second Cold Call Framework - ${lead.company_name}`,
      content: `[GREETING & PATTERN INTERRUPT]
"Hi ${firstName}, this is Alex with LeadForge. I know I caught you out of the blue—do you have 30 seconds for me to share why I reached out, and you can tell me if it's relevant?"

[REASON / PROBLEM IDENTIFICATION]
"We've been tracking companies in ${lead.industry || 'your sector'} and noticed ${lead.company_name} is scaling rapidly. Usually, leaders in your position tell us that manual prospecting and slow lead enrichment burn 15+ hours a week per team member."

[VALUE PROP]
"We automated this entire pipeline using AI agents, booking 15-20 targeted qualified meetings a month on pure autopilot."

[CLOSE FOR MEETING]
"Are you open to a brief 7-minute visual demo this Thursday or Friday to see if it makes sense for your team?"`,
      value_prop: `Time-respecting pattern interrupt followed by quantifiable ROI hook.`
    };
  }

  // Default: cold_email
  return {
    subject: `Question regarding ${lead.company_name}'s growth in ${lead.industry || 'tech'}`,
    content: `Hi ${firstName},

Saw what you and the team are building at ${lead.company_name}—impressive trajectory.

Most leaders we speak with in ${lead.industry || 'your space'} mention that manually sourcing and personalizing outreach for high-intent prospects is their biggest bottleneck to predictable revenue.

We built an autonomous AI system that enriches lead intelligence from live company signals and crafts tailored multi-channel pitches in seconds (${userOffer || 'delivering 3x higher demo conversions'}).

Would you be open to a 5-minute chat this Thursday to see what this looks like for ${lead.company_name}?

Best,
Alex Rivers | Growth & Partnerships`,
    value_prop: `Personalized cold email pairing ${lead.company_name}'s industry context with immediate pipeline velocity.`
  };
}
