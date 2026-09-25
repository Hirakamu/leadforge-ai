import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const creditsRow: any = db.prepare("SELECT value FROM user_settings WHERE key = 'credits'").get();
    const tierRow: any = db.prepare("SELECT value FROM user_settings WHERE key = 'tier'").get();

    return NextResponse.json({
      success: true,
      credits: parseInt(creditsRow?.value || '0', 10),
      tier: tierRow?.value || 'Starter Plan'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { plan, addCredits } = body;

    if (plan) {
      let newCredits = 250;
      if (plan === 'Growth') newCredits = 1000;
      if (plan === 'Agency Scale') newCredits = 5000;

      db.prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('tier', ?)").run(`${plan} Plan`);
      
      const currentCreditsRow: any = db.prepare("SELECT value FROM user_settings WHERE key = 'credits'").get();
      const currentCredits = parseInt(currentCreditsRow?.value || '0', 10);
      const updatedTotal = currentCredits + newCredits;
      
      db.prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('credits', ?)").run(updatedTotal.toString());

      db.prepare(`
        INSERT INTO activity_logs (id, action, details)
        VALUES (?, 'Plan Upgrade', ?)
      `).run(`log_${Date.now()}`, `Upgraded to ${plan} Plan (+${newCredits} lead enrichment credits added)`);

      return NextResponse.json({
        success: true,
        message: `Plan upgraded to ${plan} Plan! ${newCredits} credits added to your account.`,
        credits: updatedTotal,
        tier: `${plan} Plan`
      });
    }

    if (addCredits) {
      const currentCreditsRow: any = db.prepare("SELECT value FROM user_settings WHERE key = 'credits'").get();
      const currentCredits = parseInt(currentCreditsRow?.value || '0', 10);
      const updatedTotal = currentCredits + parseInt(addCredits, 10);
      
      db.prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('credits', ?)").run(updatedTotal.toString());

      return NextResponse.json({
        success: true,
        message: `Added ${addCredits} credits.`,
        credits: updatedTotal
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid plan or credit amount' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
