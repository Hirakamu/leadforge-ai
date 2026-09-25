import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scrapeCompanyWebsite } from '@/lib/scraper';
import { enrichCompanyData } from '@/lib/ai';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { url, company_name, lead_id } = body;

    if (!url && !lead_id) {
      return NextResponse.json({ success: false, error: 'URL or Lead ID is required' }, { status: 400 });
    }

    // Check credits
    const creditSetting: any = db.prepare("SELECT value FROM user_settings WHERE key = 'credits'").get();
    let credits = parseInt(creditSetting?.value || '0', 10);
    if (credits <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient credits. Please upgrade your subscription plan or add credits.' 
      }, { status: 402 });
    }

    let targetUrl = url;
    let targetName = company_name;
    let existingLead: any = null;

    if (lead_id) {
      existingLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead_id);
      if (!existingLead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }
      targetUrl = targetUrl || existingLead.website;
      targetName = targetName || existingLead.company_name;
    }

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: 'Company website URL could not be resolved' }, { status: 400 });
    }

    // Retrieve user offer description & API key
    const offerSetting: any = db.prepare("SELECT value FROM user_settings WHERE key = 'offer_description'").get();
    const userOffer = offerSetting?.value;
    const keySetting: any = db.prepare("SELECT value FROM user_settings WHERE key = 'gemini_api_key'").get();
    const customKey = keySetting?.value;

    // 1. Scrape Website
    const scraped = await scrapeCompanyWebsite(targetUrl);

    if (!targetName) {
      targetName = scraped.title.split(/[-|–]/)[0].trim() || 'Company';
    }

    // 2. AI Enrichment
    const enriched = await enrichCompanyData(targetName, targetUrl, scraped, userOffer, customKey);

    // 3. Save to database
    let savedLeadId = lead_id;

    if (existingLead) {
      db.prepare(`
        UPDATE leads SET
          company_name = @company_name,
          industry = @industry,
          location = @location,
          estimated_revenue = @estimated_revenue,
          employee_count = @employee_count,
          icp_score = @icp_score,
          pain_points = @pain_points,
          tech_stack = @tech_stack,
          summary = @summary,
          status = 'enriched',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({
        id: lead_id,
        company_name: enriched.company_name || targetName,
        industry: enriched.industry,
        location: enriched.location,
        estimated_revenue: enriched.estimated_revenue,
        employee_count: enriched.employee_count,
        icp_score: enriched.icp_score,
        pain_points: JSON.stringify(enriched.pain_points),
        tech_stack: JSON.stringify(enriched.tech_stack),
        summary: enriched.summary
      });
    } else {
      savedLeadId = `lead_${crypto.randomBytes(6).toString('hex')}`;
      db.prepare(`
        INSERT INTO leads (
          id, company_name, website, industry, location,
          contact_name, contact_title, contact_email, contact_linkedin,
          estimated_revenue, employee_count, icp_score, pain_points, tech_stack,
          summary, status
        ) VALUES (
          @id, @company_name, @website, @industry, @location,
          @contact_name, @contact_title, @contact_email, @contact_linkedin,
          @estimated_revenue, @employee_count, @icp_score, @pain_points, @tech_stack,
          @summary, 'enriched'
        )
      `).run({
        id: savedLeadId,
        company_name: enriched.company_name || targetName,
        website: targetUrl,
        industry: enriched.industry,
        location: enriched.location,
        contact_name: scraped.contactEmails[0] ? scraped.contactEmails[0].split('@')[0] : 'Team Lead',
        contact_title: enriched.target_buyer_persona || 'Executive Lead',
        contact_email: scraped.contactEmails[0] || `contact@${targetUrl.replace(/https?:\/\//i, '').replace(/\/.*$/, '')}`,
        contact_linkedin: scraped.socialLinks.linkedin || '',
        estimated_revenue: enriched.estimated_revenue,
        employee_count: enriched.employee_count,
        icp_score: enriched.icp_score,
        pain_points: JSON.stringify(enriched.pain_points),
        tech_stack: JSON.stringify(enriched.tech_stack),
        summary: enriched.summary
      });
    }

    // Deduct 1 credit
    credits = Math.max(0, credits - 1);
    db.prepare("UPDATE user_settings SET value = ? WHERE key = 'credits'").run(credits.toString());

    // Log Activity
    db.prepare(`
      INSERT INTO activity_logs (id, action, details)
      VALUES (?, 'AI Enrichment', ?)
    `).run(`log_${Date.now()}`, `Enriched ${enriched.company_name} (ICP Score: ${enriched.icp_score}%)`);

    return NextResponse.json({
      success: true,
      lead_id: savedLeadId,
      credits_remaining: credits,
      enriched,
      scraped
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
