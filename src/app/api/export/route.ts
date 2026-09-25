import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all().map((r: any) => ({
      ...r,
      pain_points: r.pain_points ? JSON.parse(r.pain_points).join(' | ') : '',
      tech_stack: r.tech_stack ? JSON.parse(r.tech_stack).join(', ') : ''
    }));

    if (format === 'json') {
      return NextResponse.json(leads);
    }

    // CSV format
    const headers = [
      'Company Name',
      'Website',
      'Industry',
      'Location',
      'Contact Name',
      'Contact Title',
      'Contact Email',
      'LinkedIn',
      'Estimated Revenue',
      'Employees',
      'ICP Score',
      'Status',
      'Key Pain Points',
      'Tech Stack',
      'Summary'
    ];

    const rows = leads.map((l: any) => [
      `"${(l.company_name || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.industry || '').replace(/"/g, '""')}"`,
      `"${(l.location || '').replace(/"/g, '""')}"`,
      `"${(l.contact_name || '').replace(/"/g, '""')}"`,
      `"${(l.contact_title || '').replace(/"/g, '""')}"`,
      `"${(l.contact_email || '').replace(/"/g, '""')}"`,
      `"${(l.contact_linkedin || '').replace(/"/g, '""')}"`,
      `"${(l.estimated_revenue || '').replace(/"/g, '""')}"`,
      `"${(l.employee_count || '').replace(/"/g, '""')}"`,
      l.icp_score || 0,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.pain_points || '').replace(/"/g, '""')}"`,
      `"${(l.tech_stack || '').replace(/"/g, '""')}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leadforge_leads_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
