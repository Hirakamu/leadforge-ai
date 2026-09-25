import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { industry = 'SaaS & Cloud', location = 'United States', keyword = '' } = await req.json();

    // Industry tailored prospect blueprints
    const companyTemplates: Record<string, Array<{ name: string; domain: string; desc: string; rev: string; emps: string; role: string; emailSuffix: string }>> = {
      'SaaS & Cloud': [
        { name: 'Veloce Data Engine', domain: 'https://velocedata.io', desc: 'Real-time analytics engine for streaming data pipelines and lakehouses.', rev: '$12M - $20M ARR', emps: '65-90', role: 'VP of Product Marketing', emailSuffix: 'velocedata.io' },
        { name: 'StackPulse Security', domain: 'https://stackpulse.dev', desc: 'Automated container vulnerability scanning and compliance agent for Kubernetes.', rev: '$8M - $14M ARR', emps: '45-70', role: 'Head of Developer Relations', emailSuffix: 'stackpulse.dev' },
        { name: 'OmniDesk Workspace', domain: 'https://omnidesk.app', desc: 'All-in-one collaborative documentation and async decision platform for remote engineering teams.', rev: '$6M - $10M ARR', emps: '35-55', role: 'VP of Growth', emailSuffix: 'omnidesk.app' },
        { name: 'SynthOps AI', domain: 'https://synthops.tech', desc: 'Autonomous incident response triage and alert clustering for cloud infrastructure.', rev: '$15M - $25M ARR', emps: '80-110', role: 'Chief Technology Officer', emailSuffix: 'synthops.tech' },
        { name: 'PulseFlow Metrics', domain: 'https://pulseflow.io', desc: 'Customer telemetry and retention intelligence software for B2B SaaS companies.', rev: '$4M - $9M ARR', emps: '25-45', role: 'Founder & CEO', emailSuffix: 'pulseflow.io' }
      ],
      'FinTech & Payments': [
        { name: 'PayBridge Global', domain: 'https://paybridge.co', desc: 'Unified multi-currency settlement gateway for cross-border digital platforms.', rev: '$25M - $45M ARR', emps: '140-200', role: 'VP of Global Partnerships', emailSuffix: 'paybridge.co' },
        { name: 'LedgerSmart Tax', domain: 'https://ledgersmart.io', desc: 'Automated sales tax and VAT compliance engine for fast-growing online merchants.', rev: '$9M - $16M ARR', emps: '50-80', role: 'Chief Financial Officer', emailSuffix: 'ledgersmart.io' },
        { name: 'VaultShield ID', domain: 'https://vaultshield.tech', desc: 'Frictionless biometric KYC and fraud prevention SDK for modern banking apps.', rev: '$18M - $30M ARR', emps: '90-130', role: 'Head of Risk & Fraud', emailSuffix: 'vaultshield.tech' }
      ],
      'E-Commerce & DTC': [
        { name: 'Lumina Supply Co.', domain: 'https://luminasupply.com', desc: 'Direct-to-consumer sustainable home essentials and smart lifestyle goods.', rev: '$14M - $22M GMV', emps: '40-60', role: 'Chief Marketing Officer', emailSuffix: 'luminasupply.com' },
        { name: 'Verve Athletic Gear', domain: 'https://vervegear.shop', desc: 'High-performance athletic apparel utilizing recycled ocean polymers.', rev: '$20M - $35M GMV', emps: '75-100', role: 'VP of E-Commerce Operations', emailSuffix: 'vervegear.shop' },
        { name: 'Aura Botanicals', domain: 'https://aurabotanicals.co', desc: 'Clean formulation skincare and wellness brand with strong subscription retention.', rev: '$8M - $15M GMV', emps: '30-50', role: 'Head of Growth Marketing', emailSuffix: 'aurabotanicals.co' }
      ],
      'Healthcare & BioTech': [
        { name: 'TheraPulse Health', domain: 'https://therapulse.care', desc: 'Remote patient monitoring and vitals telemetry for specialty outpatient clinics.', rev: '$11M - $18M ARR', emps: '55-85', role: 'VP of Clinical Operations', emailSuffix: 'therapulse.care' },
        { name: 'MediSync AI', domain: 'https://medisync.io', desc: 'Clinical notes ambient transcription and EHR medical coding assistant.', rev: '$16M - $28M ARR', emps: '70-110', role: 'Chief Medical Officer', emailSuffix: 'medisync.io' }
      ]
    };

    const selectedList = companyTemplates[industry] || companyTemplates['SaaS & Cloud'];
    const names = ['Alex Mercer', 'Sarah Chen', 'David Kim', 'Rachel Dupont', 'Michael Rossi', 'Elena Torres', 'Liam O\'Connor'];

    const discoveredLeads = selectedList.map((tpl, idx) => {
      const contactPerson = names[idx % names.length];
      const icpScore = 86 + Math.floor(Math.random() * 12); // 86 - 98

      return {
        id: `lead_${crypto.randomBytes(6).toString('hex')}`,
        company_name: tpl.name,
        website: tpl.domain,
        industry: industry,
        location: location,
        contact_name: contactPerson,
        contact_title: tpl.role,
        contact_email: `${contactPerson.toLowerCase().replace(/[' ]/g, '.')}@${tpl.emailSuffix}`,
        contact_linkedin: `https://linkedin.com/in/${contactPerson.toLowerCase().replace(/[' ]/g, '-')}`,
        estimated_revenue: tpl.rev,
        employee_count: tpl.emps,
        icp_score: icpScore,
        pain_points: [
          `High outbound CAC and low conversion from unpersonalized SDR messaging`,
          `Need automated lead intelligence to prioritize high-intent accounts`,
          `Time spent on manual prospecting hindering deal closing velocity`
        ],
        tech_stack: ['Next.js', 'Stripe', 'HubSpot', 'PostgreSQL', 'AWS'],
        summary: tpl.desc,
        status: 'discovered'
      };
    });

    return NextResponse.json({
      success: true,
      count: discoveredLeads.length,
      prospects: discoveredLeads
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
