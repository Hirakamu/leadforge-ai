import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateOutreachPitch } from '@/lib/ai';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { lead_id, pitch_type = 'cold_email', tone = 'conversational', custom_angle } = body;

    if (!lead_id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const lead: any = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead_id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const offerSetting: any = db.prepare("SELECT value FROM user_settings WHERE key = 'offer_description'").get();
    const userOffer = custom_angle || offerSetting?.value || 'High-performance AI automation and sales conversion pipelines.';

    const keySetting: any = db.prepare("SELECT value FROM user_settings WHERE key = 'gemini_api_key'").get();
    const customKey = keySetting?.value;

    const leadData = {
      company_name: lead.company_name,
      website: lead.website,
      industry: lead.industry,
      contact_name: lead.contact_name,
      contact_title: lead.contact_title,
      summary: lead.summary,
      pain_points: lead.pain_points ? JSON.parse(lead.pain_points) : [],
      tech_stack: lead.tech_stack ? JSON.parse(lead.tech_stack) : []
    };

    const pitchResult = await generateOutreachPitch(leadData, userOffer, tone, pitch_type, customKey);

    const pitchId = `pitch_${crypto.randomBytes(6).toString('hex')}`;
    db.prepare(`
      INSERT INTO pitches (id, lead_id, type, subject, content, tone, value_prop)
      VALUES (@id, @lead_id, @type, @subject, @content, @tone, @value_prop)
    `).run({
      id: pitchId,
      lead_id,
      type: pitch_type,
      subject: pitchResult.subject,
      content: pitchResult.content,
      tone,
      value_prop: pitchResult.value_prop
    });

    // Automatically advance lead status if in earlier stage
    if (lead.status === 'discovered' || lead.status === 'enriched') {
      db.prepare("UPDATE leads SET status = 'pitched', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(lead_id);
    }

    // Log Activity
    db.prepare(`
      INSERT INTO activity_logs (id, action, details)
      VALUES (?, 'Pitch Generated', ?)
    `).run(`log_${Date.now()}`, `Generated ${pitch_type} for ${lead.contact_name || lead.company_name}`);

    return NextResponse.json({
      success: true,
      pitch: {
        id: pitchId,
        lead_id,
        type: pitch_type,
        ...pitchResult
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
