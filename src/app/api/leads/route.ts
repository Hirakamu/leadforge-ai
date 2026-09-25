import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const minIcp = searchParams.get('minIcp');

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR industry LIKE ? OR contact_name LIKE ? OR summary LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (minIcp) {
      query += ' AND icp_score >= ?';
      params.push(parseInt(minIcp, 10));
    }

    query += ' ORDER BY created_at DESC';

    const leads = db.prepare(query).all(...params).map((row: any) => ({
      ...row,
      pain_points: row.pain_points ? JSON.parse(row.pain_points) : [],
      tech_stack: row.tech_stack ? JSON.parse(row.tech_stack) : []
    }));

    return NextResponse.json({ success: true, count: leads.length, leads });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    // Check if bulk insert or single
    if (Array.isArray(body)) {
      const insert = db.prepare(`
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

      const insertMany = db.transaction((leadsToInsert: any[]) => {
        for (const lead of leadsToInsert) {
          const id = lead.id || `lead_${crypto.randomBytes(6).toString('hex')}`;
          insert.run({
            id,
            company_name: lead.company_name || 'Unnamed Company',
            website: lead.website || '',
            industry: lead.industry || 'Technology',
            location: lead.location || 'Global',
            contact_name: lead.contact_name || '',
            contact_title: lead.contact_title || '',
            contact_email: lead.contact_email || '',
            contact_linkedin: lead.contact_linkedin || '',
            estimated_revenue: lead.estimated_revenue || '$5M - $15M ARR',
            employee_count: lead.employee_count || '25-50',
            icp_score: lead.icp_score || 80,
            pain_points: JSON.stringify(lead.pain_points || []),
            tech_stack: JSON.stringify(lead.tech_stack || []),
            summary: lead.summary || '',
            status: lead.status || 'discovered'
          });
        }
      });

      insertMany(body);

      // Log activity
      db.prepare(`
        INSERT INTO activity_logs (id, action, details)
        VALUES (?, 'Bulk Import', ?)
      `).run(`log_${Date.now()}`, `Imported ${body.length} new prospects into pipeline`);

      return NextResponse.json({ success: true, count: body.length, message: `Successfully imported ${body.length} leads.` });
    } else {
      const id = body.id || `lead_${crypto.randomBytes(6).toString('hex')}`;
      const insert = db.prepare(`
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

      insert.run({
        id,
        company_name: body.company_name,
        website: body.website || '',
        industry: body.industry || 'Technology',
        location: body.location || 'United States',
        contact_name: body.contact_name || '',
        contact_title: body.contact_title || '',
        contact_email: body.contact_email || '',
        contact_linkedin: body.contact_linkedin || '',
        estimated_revenue: body.estimated_revenue || '$5M - $15M ARR',
        employee_count: body.employee_count || '30-80',
        icp_score: body.icp_score || 85,
        pain_points: JSON.stringify(body.pain_points || []),
        tech_stack: JSON.stringify(body.tech_stack || []),
        summary: body.summary || '',
        status: body.status || 'discovered'
      });

      // Log activity
      db.prepare(`
        INSERT INTO activity_logs (id, action, details)
        VALUES (?, 'Lead Added', ?)
      `).run(`log_${Date.now()}`, `Created prospect record for ${body.company_name}`);

      return NextResponse.json({ success: true, id, message: 'Lead added successfully.' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
