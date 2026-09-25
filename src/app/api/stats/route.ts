import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    const totalLeadsRow: any = db.prepare('SELECT COUNT(*) as count FROM leads').get();
    const totalLeads = totalLeadsRow?.count || 0;

    const highIcpRow: any = db.prepare('SELECT COUNT(*) as count FROM leads WHERE icp_score >= 85').get();
    const highIcpLeads = highIcpRow?.count || 0;

    const totalPitchesRow: any = db.prepare('SELECT COUNT(*) as count FROM pitches').get();
    const totalPitches = totalPitchesRow?.count || 0;

    const convertedRow: any = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'converted'").get();
    const convertedCount = convertedRow?.count || 0;

    const repliedRow: any = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'replied'").get();
    const repliedCount = repliedRow?.count || 0;

    const pitchedRow: any = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'pitched'").get();
    const pitchedCount = pitchedRow?.count || 0;

    const creditsRow: any = db.prepare("SELECT value FROM user_settings WHERE key = 'credits'").get();
    const credits = parseInt(creditsRow?.value || '0', 10);

    const tierRow: any = db.prepare("SELECT value FROM user_settings WHERE key = 'tier'").get();
    const currentTier = tierRow?.value || 'Starter Plan';

    const recentLogs = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 8').all();

    const pipelineBreakdown = {
      discovered: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'discovered'").get() as any)?.count || 0,
      enriched: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'enriched'").get() as any)?.count || 0,
      pitched: pitchedCount,
      replied: repliedCount,
      converted: convertedCount,
    };

    // Calculate approximate pipeline value based on lead count & estimated enterprise deal sizes
    const pipelineValue = (totalLeads * 3500);

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        highIcpLeads,
        totalPitches,
        conversionRate: totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0',
        responseRate: pitchedCount > 0 ? (((repliedCount + convertedCount) / pitchedCount) * 100).toFixed(1) : '0',
        pipelineValue,
        creditsRemaining: credits,
        tier: currentTier,
        pipelineBreakdown,
        recentLogs
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
