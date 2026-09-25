import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const leadId = params.id;

    const lead: any = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const pitches = db.prepare('SELECT * FROM pitches WHERE lead_id = ? ORDER BY generated_at DESC').all(leadId);

    return NextResponse.json({
      success: true,
      lead: {
        ...lead,
        pain_points: lead.pain_points ? JSON.parse(lead.pain_points) : [],
        tech_stack: lead.tech_stack ? JSON.parse(lead.tech_stack) : []
      },
      pitches
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const leadId = params.id;
    const body = await req.json();

    const existing: any = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const updateFields = [];
    const updateValues: any = {};

    const allowed = [
      'company_name', 'website', 'industry', 'location',
      'contact_name', 'contact_title', 'contact_email', 'contact_linkedin',
      'estimated_revenue', 'employee_count', 'icp_score', 'summary', 'status'
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateFields.push(`${key} = @${key}`);
        updateValues[key] = body[key];
      }
    }

    if (body.pain_points !== undefined) {
      updateFields.push('pain_points = @pain_points');
      updateValues.pain_points = JSON.stringify(body.pain_points);
    }

    if (body.tech_stack !== undefined) {
      updateFields.push('tech_stack = @tech_stack');
      updateValues.tech_stack = JSON.stringify(body.tech_stack);
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");

    updateValues.id = leadId;
    const sql = `UPDATE leads SET ${updateFields.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(updateValues);

    return NextResponse.json({ success: true, message: 'Lead updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const leadId = params.id;

    db.prepare('DELETE FROM leads WHERE id = ?').run(leadId);
    db.prepare('DELETE FROM pitches WHERE lead_id = ?').run(leadId);

    return NextResponse.json({ success: true, message: 'Lead removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
