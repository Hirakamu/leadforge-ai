'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Search,
  Zap,
  CheckCircle2,
  TrendingUp,
  Globe,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Send,
  Download,
  Sliders,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Target,
  Users,
  Flame,
  BarChart3,
  X
} from 'lucide-react';

interface Lead {
  id: string;
  company_name: string;
  website: string;
  industry: string;
  location: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_linkedin: string;
  estimated_revenue: string;
  employee_count: string;
  icp_score: number;
  pain_points: string[];
  tech_stack: string[];
  summary: string;
  status: 'discovered' | 'enriched' | 'pitched' | 'replied' | 'converted' | 'archived';
  created_at: string;
}

interface Pitch {
  id: string;
  lead_id: string;
  type: 'cold_email' | 'linkedin_dm' | 'follow_up' | 'call_script';
  subject: string;
  content: string;
  tone: string;
  value_prop: string;
  generated_at: string;
}

interface Stats {
  totalLeads: number;
  highIcpLeads: number;
  totalPitches: number;
  conversionRate: string;
  responseRate: string;
  pipelineValue: number;
  creditsRemaining: number;
  tier: string;
  pipelineBreakdown: Record<string, number>;
  recentLogs: Array<{ id: string; action: string; details: string; timestamp: string }>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'leads' | 'kanban' | 'pricing' | 'settings'>('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadPitches, setLeadPitches] = useState<Pitch[]>([]);
  
  // Quick Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickDomainUrl, setQuickDomainUrl] = useState('');
  const [enriching, setEnriching] = useState(false);

  // Pitch Generation Form
  const [pitchType, setPitchType] = useState<'cold_email' | 'linkedin_dm' | 'follow_up' | 'call_script'>('cold_email');
  const [pitchTone, setPitchTone] = useState('conversational');
  const [customAngle, setCustomAngle] = useState('');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Discovery Generator State
  const [discoveryIndustry, setDiscoveryIndustry] = useState('SaaS & Cloud');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredList, setDiscoveredList] = useState<any[]>([]);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    company_name: '',
    website: '',
    industry: 'Technology',
    contact_name: '',
    contact_title: '',
    contact_email: '',
  });

  // Settings state
  const [offerDescription, setOfferDescription] = useState('We build autonomous AI agents that eliminate repetitive manual workflows and 10x sales outreach response rates.');
  const [customApiKey, setCustomApiKey] = useState('');
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, statsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/stats')
      ]);

      const leadsData = await leadsRes.json();
      const statsData = await statsRes.json();

      if (leadsData.success) setLeads(leadsData.leads);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.settings.offer_description) setOfferDescription(data.settings.offer_description);
        if (data.settings.gemini_api_key) setCustomApiKey(data.settings.gemini_api_key);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const openLeadDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    try {
      const res = await fetch(`/api/leads/${lead.id}`);
      const data = await res.json();
      if (data.success) {
        setLeadPitches(data.pitches || []);
      }
    } catch (err) {
      console.error('Failed to fetch lead details:', err);
    }
  };

  const handleQuickEnrich = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickDomainUrl) return;

    try {
      setEnriching(true);
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickDomainUrl })
      });

      const data = await res.json();
      if (data.success) {
        setQuickDomainUrl('');
        await fetchData();
        // Trigger celebratory confetti
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.2 } });
        // Automatically open the enriched lead
        const updatedRes = await fetch(`/api/leads/${data.lead_id}`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          openLeadDetail(updatedData.lead);
        }
      } else {
        alert(data.error || 'Failed to enrich domain');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while enriching domain');
    } finally {
      setEnriching(false);
    }
  };

  const handleEnrichExisting = async (leadId: string) => {
    try {
      setEnriching(true);
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        if (selectedLead && selectedLead.id === leadId) {
          const updatedRes = await fetch(`/api/leads/${leadId}`);
          const updatedData = await updatedRes.json();
          if (updatedData.success) {
            setSelectedLead(updatedData.lead);
          }
        }
      } else {
        alert(data.error || 'Failed to enrich lead');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to enrich lead');
    } finally {
      setEnriching(false);
    }
  };

  const handleGeneratePitch = async () => {
    if (!selectedLead) return;

    try {
      setGeneratingPitch(true);
      const res = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          pitch_type: pitchType,
          tone: pitchTone,
          custom_angle: customAngle || offerDescription
        })
      });

      const data = await res.json();
      if (data.success) {
        setLeadPitches(prev => [data.pitch, ...prev]);
        await fetchData();
        // Update selected lead status locally
        setSelectedLead(prev => prev ? { ...prev, status: 'pitched' } : null);
      } else {
        alert(data.error || 'Failed to generate pitch');
      }
    } catch (err: any) {
      alert(err.message || 'Pitch generation error');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
        }
        if (newStatus === 'converted') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this prospect from your pipeline?')) return;
    try {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (selectedLead?.id === leadId) setSelectedLead(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const handleDiscoverIndustry = async () => {
    try {
      setDiscovering(true);
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: discoveryIndustry })
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredList(data.prospects);
      }
    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const handleImportDiscovered = async (prospectsToAdd: any[]) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospectsToAdd)
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 80, spread: 70 });
        setDiscoveredList([]);
        fetchData();
        setActiveTab('leads');
      }
    } catch (err) {
      console.error('Failed to import discovered prospects:', err);
    }
  };

  const handleAddSingleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewLeadForm({
          company_name: '',
          website: '',
          industry: 'Technology',
          contact_name: '',
          contact_title: '',
          contact_email: '',
        });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  const handleUpgradePlan = async (plan: string) => {
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        fetchData();
        alert(`🎉 ${data.message}`);
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_description: offerDescription,
          gemini_api_key: customApiKey
        })
      });
      if (res.ok) {
        setSavedSettingsSuccess(true);
        setTimeout(() => setSavedSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Settings save error:', err);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = !searchQuery || 
      l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.contact_name && l.contact_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'discovered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">Discovered</span>;
      case 'enriched':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-700">AI Enriched</span>;
      case 'pitched':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-300 border border-amber-700">Pitched</span>;
      case 'replied':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-700">Replied</span>;
      case 'converted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-700">Closed / Won</span>;
      case 'archived':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400">Archived</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top App Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  LeadForge AI
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                  B2B Micro-SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Sales Intelligence & Outreach Engine</p>
            </div>
          </div>

          {/* Quick Domain Scanner input in Header */}
          <form onSubmit={handleQuickEnrich} className="flex items-center w-full md:w-96 relative">
            <input
              type="text"
              placeholder="Paste company URL to enrich (e.g. stripe.com)..."
              value={quickDomainUrl}
              onChange={(e) => setQuickDomainUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-24 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Globe className="w-4 h-4 text-slate-400 absolute left-3" />
            <button
              type="submit"
              disabled={enriching || !quickDomainUrl}
              className="absolute right-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 transition-all"
            >
              {enriching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-300" />}
              <span>{enriching ? 'Scraping...' : 'Enrich'}</span>
            </button>
          </form>

          {/* User Credits & Plan Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {stats?.tier || 'Growth Plan'}
                </span>
                <span className="text-xs font-bold text-indigo-400 flex items-center justify-end gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {stats?.creditsRemaining ?? 125} Credits
                </span>
              </div>
              <button
                onClick={() => setActiveTab('pricing')}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs px-2.5 py-1 rounded-md font-medium shadow-sm transition-all"
              >
                + Upgrade
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Total Pipeline Leads</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalLeads ?? 0}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +18% this week
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>High ICP Fits (85%+)</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats?.highIcpLeads ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">High conversion priority</div>
          </div>

          <div className="glass-card p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Pitches Generated</span>
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalPitches ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Multi-channel copy</div>
          </div>

          <div className="glass-card p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Est. Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              ${((stats?.pipelineValue || 0)).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Active prospective deal size</div>
          </div>

          <div className="glass-card p-4 rounded-xl relative overflow-hidden col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Outreach Win Rate</span>
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-400">{stats?.responseRate || '33.3'}%</div>
            <div className="text-[11px] text-emerald-400 mt-1">3.4x industry benchmark</div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-3">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              📊 Pipeline Overview
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'discovery'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              🎯 Lead Discovery Engine
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'leads'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              📋 All Prospects CRM ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              📌 Deal Funnel
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'pricing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              💳 Pricing & SaaS Monetization
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              ⚙️ Value Prop & AI Settings
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <a
              href="/api/export?format=csv"
              download
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Prospect</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Pipeline Stage Breakdown & Quick Actions */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Funnel Stage Visualizer */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Outreach Pipeline Funnel</h3>
                    <p className="text-xs text-slate-400">Prospect stages from discovery to closed business</p>
                  </div>
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-800">
                    Live Velocity
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { key: 'discovered', label: 'Discovered', count: stats?.pipelineBreakdown.discovered || 0, color: 'bg-slate-800 text-slate-300 border-slate-700' },
                    { key: 'enriched', label: 'AI Enriched', count: stats?.pipelineBreakdown.enriched || 0, color: 'bg-indigo-950 text-indigo-300 border-indigo-700' },
                    { key: 'pitched', label: 'Pitched', count: stats?.pipelineBreakdown.pitched || 0, color: 'bg-amber-950 text-amber-300 border-amber-700' },
                    { key: 'replied', label: 'Replied', count: stats?.pipelineBreakdown.replied || 0, countColor: 'text-cyan-400', color: 'bg-cyan-950 text-cyan-300 border-cyan-700' },
                    { key: 'converted', label: 'Closed Won', count: stats?.pipelineBreakdown.converted || 0, countColor: 'text-emerald-400', color: 'bg-emerald-950 text-emerald-300 border-emerald-700' },
                  ].map((stage, i) => (
                    <div key={stage.key} className={`p-3 rounded-xl border ${stage.color} flex flex-col items-center justify-center`}>
                      <span className="text-[11px] font-medium opacity-80">{stage.label}</span>
                      <span className={`text-xl font-bold mt-1 ${stage.countColor || 'text-white'}`}>{stage.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Intent Leads Priority Queue */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-semibold text-white">High-Intent ICP Prospects</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    View All ({leads.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {leads.slice(0, 4).map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => openLeadDetail(lead)}
                      className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-300 font-bold text-sm">
                          {lead.company_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {lead.company_name}
                            </span>
                            {getStatusBadge(lead.status)}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{lead.industry}</span>
                            <span>•</span>
                            <span>{lead.contact_name ? `${lead.contact_name} (${lead.contact_title || 'Lead'})` : lead.website}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-400">{lead.icp_score}% ICP</span>
                          <p className="text-[10px] text-slate-500">{lead.estimated_revenue || '$5M - $15M'}</p>
                        </div>
                        <button className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-xs font-medium border border-indigo-500/30 transition-all">
                          Generate Pitch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 1 Col: Live Activity Stream & Quick Offer Card */}
            <div className="flex flex-col gap-6">
              
              {/* Active Offer / Value Prop Card */}
              <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Active Value Proposition</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">
                  &ldquo;{offerDescription}&rdquo;
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Used for hyper-personalized pitches</span>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="text-xs text-indigo-400 hover:underline font-medium"
                  >
                    Edit Hook
                  </button>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent System Activity</span>
                </h3>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                  {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                    stats.recentLogs.map((log) => (
                      <div key={log.id} className="text-xs border-l-2 border-indigo-500/60 pl-3 py-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold text-white">{log.action}</span>
                          <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-6">No recent actions logged yet.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: LEAD DISCOVERY ENGINE */}
        {activeTab === 'discovery' && (
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="max-w-3xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  Autonomous B2B Lead Discovery
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Generate verified high-intent company accounts in target industries with automated ICP scoring and decision-maker contact discovery.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Industry / Niche</label>
                  <select
                    value={discoveryIndustry}
                    onChange={(e) => setDiscoveryIndustry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SaaS & Cloud">SaaS & Cloud Software ($5M-$25M ARR)</option>
                    <option value="FinTech & Payments">B2B FinTech & Digital Payments</option>
                    <option value="E-Commerce & DTC">Fast-Growing E-Commerce & DTC Brands</option>
                    <option value="Healthcare & BioTech">Digital Health & HealthTech Platforms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Geography</label>
                  <input
                    type="text"
                    defaultValue="United States & Global Remote"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleDiscoverIndustry}
                    disabled={discovering}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {discovering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    <span>{discovering ? 'Discovering Accounts...' : 'Find High-Intent Leads'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Discovered Prospects Table Preview */}
            {discoveredList.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Discovered Accounts ({discoveredList.length})</h3>
                    <p className="text-xs text-slate-400">Ready to import into your pipeline & run AI personalization</p>
                  </div>
                  <button
                    onClick={() => handleImportDiscovered(discoveredList)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Import All {discoveredList.length} Leads to Pipeline</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {discoveredList.map((prospect, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{prospect.company_name}</span>
                          <a href={prospect.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                            {prospect.website.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {prospect.icp_score}% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl">{prospect.summary}</p>
                        <div className="text-xs text-slate-300 flex items-center gap-3 mt-2">
                          <span>👤 <strong>{prospect.contact_name}</strong> ({prospect.contact_title})</span>
                          <span>✉️ {prospect.contact_email}</span>
                          <span>💰 {prospect.estimated_revenue}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleImportDiscovered([prospect])}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all self-start md:self-center"
                      >
                        + Add Lead
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEADS CRM TABLE */}
        {activeTab === 'leads' && (
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Search company, contact, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Stages</option>
                  <option value="discovered">Discovered</option>
                  <option value="enriched">AI Enriched</option>
                  <option value="pitched">Pitched</option>
                  <option value="replied">Replied</option>
                  <option value="converted">Closed Won</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong>{filteredLeads.length}</strong> of {leads.length} prospects
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Key Contact</th>
                    <th className="py-3 px-4">Industry / Rev</th>
                    <th className="py-3 px-4 text-center">ICP Score</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => openLeadDetail(lead)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {lead.company_name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" />
                          <span>{lead.website.replace('https://', '')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{lead.contact_name || '—'}</div>
                        <div className="text-[11px] text-slate-400">{lead.contact_title || lead.contact_email || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{lead.industry}</div>
                        <div className="text-[11px] text-slate-400">{lead.estimated_revenue || 'Mid-Market'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          lead.icp_score >= 90 ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800' :
                          lead.icp_score >= 80 ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-800' :
                          'text-amber-400 bg-amber-950/60'
                        }`}>
                          {lead.icp_score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLeadDetail(lead);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium shadow-sm transition-all"
                        >
                          Generate Pitch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 4: KANBAN FUNNEL */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {(['discovered', 'enriched', 'pitched', 'replied', 'converted'] as const).map((stage) => {
              const stageLeads = leads.filter(l => l.status === stage);
              const stageTitles = {
                discovered: '1. Discovered',
                enriched: '2. AI Enriched',
                pitched: '3. Pitched',
                replied: '4. Replied',
                converted: '5. Closed Won'
              };

              return (
                <div key={stage} className="glass-panel p-4 rounded-xl flex flex-col min-h-[480px]">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <span className="font-semibold text-xs text-white">{stageTitles[stage]}</span>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => openLeadDetail(lead)}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-white">{lead.company_name}</span>
                          <span className="text-[10px] font-bold text-emerald-400">{lead.icp_score}%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{lead.summary || lead.industry}</p>
                        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{lead.contact_name || 'Prospect'}</span>
                          <span className="text-indigo-400 font-medium">Open Studio →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: PRICING & SAAS MONETIZATION */}
        {activeTab === 'pricing' && (
          <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full py-4">
            <div className="text-center">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
                SaaS Subscription & Credit Packs
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">
                Predictable Pricing for Outbound Revenue Teams
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-lg mx-auto">
                Enrich companies with AI web crawling, score high-intent accounts, and craft tailored multi-channel pitches that 3x reply rates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Plan 1: Starter */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">Starter</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Solopreneurs</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$49</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Essential outbound intelligence for solo founders and consultants.</p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 250 AI Enrichment Credits/mo</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Cold Email & LinkedIn Pitch Generator</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Live Web Crawler & Tech Stack Detector</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> CSV Pipeline Export</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan('Starter')}
                  className="w-full mt-8 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Choose Starter
                </button>
              </div>

              {/* Plan 2: Growth (Highlighted) */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-indigo-500/50 glow-indigo relative bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">Growth Scale</h3>
                    <span className="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">Fast Scaling</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$149</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Complete outbound sales automation for high-velocity sales teams.</p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1,000 AI Enrichment Credits/mo</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-Channel Sequences (Email, DM, Call Script)</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> B2B Lead Discovery Engine by Industry</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom Value Proposition Alignment</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority Gemini 1.5 Pro Enrichment</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan('Growth')}
                  className="w-full mt-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Activate Growth Plan
                </button>
              </div>

              {/* Plan 3: Agency */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">Agency Scale</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">High Volume</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$399</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Unlimited power for lead generation agencies and SDR teams.</p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5,000 AI Credits/mo</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Team Seats</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated Webhook Integration & API Access</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> White-label Client Export Reports</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan('Agency Scale')}
                  className="w-full mt-8 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Choose Agency Scale
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS & VALUE PROP CONFIG */}
        {activeTab === 'settings' && (
          <div className="glass-panel p-6 rounded-2xl max-w-2xl mx-auto w-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              Sales Positioning & AI Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Customize how LeadForge AI matches your product/service value proposition to prospect pain points.
            </p>

            <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Product / Service Value Proposition
                </label>
                <textarea
                  rows={4}
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder="e.g. We build autonomous AI software and high-conversion sales pipelines that double demo bookings without expanding headcount..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The AI references this hook when generating tailored pitches for every prospect.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gemini API Key (Optional Override)
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave blank to use the built-in system key & intelligent heuristic fallback engine.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between">
                {savedSettingsSuccess ? (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* LEAD DETAIL & AI OUTREACH STUDIO DRAWER / MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-300">
                  {selectedLead.company_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedLead.company_name}</h2>
                    {getStatusBadge(selectedLead.status)}
                  </div>
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {selectedLead.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEnrichExisting(selectedLead.id)}
                  disabled={enriching}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  title="Re-run live AI crawl"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${enriching ? 'animate-spin' : ''}`} />
                  <span className="text-[11px]">Re-Enrich</span>
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* ICP & Intelligence Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ICP Score</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{selectedLead.icp_score}% Match</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Est. Revenue</span>
                  <div className="text-sm font-bold text-white mt-1">{selectedLead.estimated_revenue || '$5M - $15M'}</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Headcount</span>
                  <div className="text-sm font-bold text-white mt-1">{selectedLead.employee_count || '50-100'}</div>
                </div>
              </div>

              {/* Company Summary */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Company Intelligence</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedLead.summary || 'No overview scraped yet.'}</p>
                
                {/* Tech Stack Badges */}
                {selectedLead.tech_stack && selectedLead.tech_stack.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">Detected Tech Stack:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.tech_stack.map((tech, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pain Points */}
              {selectedLead.pain_points && selectedLead.pain_points.length > 0 && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Target Operational Pain Points
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedLead.pain_points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Contact Info */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Target Decision Maker</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Person</span>
                    <span className="font-semibold text-white">{selectedLead.contact_name || 'Executive Lead'}</span>
                    <span className="text-slate-400 block text-[11px]">{selectedLead.contact_title || 'VP / Director'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <a href={`mailto:${selectedLead.contact_email}`} className="text-indigo-400 hover:underline">
                      {selectedLead.contact_email || 'contact@company.com'}
                    </a>
                  </div>
                </div>
              </div>

              {/* AI OUTREACH PITCH GENERATOR STUDIO */}
              <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 p-5 rounded-2xl border border-indigo-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    AI Outreach Studio
                  </h4>
                  <span className="text-[10px] text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700 font-medium">
                    1-Click Touchpoints
                  </span>
                </div>

                {/* Pitch Type Selector */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 mb-3">
                  {[
                    { key: 'cold_email', label: '✉️ Cold Email' },
                    { key: 'linkedin_dm', label: '💼 LinkedIn' },
                    { key: 'follow_up', label: '🔄 Day 3 Bump' },
                    { key: 'call_script', label: '📞 60s Call' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPitchType(tab.key as any)}
                      className={`py-1.5 rounded text-[11px] font-medium transition-all ${
                        pitchType === tab.key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tone and Custom Angle */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Tone of Voice</label>
                    <select
                      value={pitchTone}
                      onChange={(e) => setPitchTone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="conversational">Conversational & Direct</option>
                      <option value="consultative">Consultative & ROI-Focused</option>
                      <option value="problem-agitate-solve">Problem-Agitate-Solve</option>
                      <option value="short-punchy">Short & Punchy (&lt;60 words)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Custom Pitch Angle (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Focus on eliminating SDR manual qualification"
                      value={customAngle}
                      onChange={(e) => setCustomAngle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGeneratePitch}
                  disabled={generatingPitch}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {generatingPitch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{generatingPitch ? 'Synthesizing Pitch Intelligence...' : `Generate ${pitchType.replace('_', ' ').toUpperCase()}`}</span>
                </button>
              </div>

              {/* GENERATED PITCHES LIST */}
              {leadPitches.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Generated Copy & Sequences ({leadPitches.length})
                  </h4>

                  {leadPitches.map((pitch) => (
                    <div key={pitch.id} className="glass-card p-4 rounded-xl border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          {pitch.type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(pitch.content);
                              setCopiedText(true);
                              setTimeout(() => setCopiedText(false), 2000);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 font-medium transition-colors"
                          >
                            {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedText ? 'Copied!' : 'Copy'}</span>
                          </button>
                          {selectedLead.contact_email && (
                            <a
                              href={`mailto:${selectedLead.contact_email}?subject=${encodeURIComponent(pitch.subject || '')}&body=${encodeURIComponent(pitch.content)}`}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] flex items-center gap-1 font-medium transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>Open in Email</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {pitch.subject && pitch.subject !== 'N/A' && (
                        <div className="text-xs bg-slate-950/60 p-2 rounded border border-slate-800 font-mono text-slate-200">
                          <span className="text-slate-500 font-sans">Subject: </span>{pitch.subject}
                        </div>
                      )}

                      <div className="text-xs text-slate-200 whitespace-pre-line bg-slate-950/40 p-3 rounded border border-slate-800/80 font-sans leading-relaxed">
                        {pitch.content}
                      </div>

                      <div className="text-[10px] text-slate-400 italic pt-1">
                        Hook Strategy: {pitch.value_prop}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STAGE SWITCHER & ACTIONS */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Update Pipeline Stage:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['discovered', 'enriched', 'pitched', 'replied', 'converted'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => updateLeadStatus(selectedLead.id, st)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          selectedLead.status === st
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
                >
                  Delete Lead
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MANUAL ADD PROSPECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Add New Prospect</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSingleLead} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Cloud"
                  value={newLeadForm.company_name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, company_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Website URL *</label>
                <input
                  required
                  type="text"
                  placeholder="https://acme.com"
                  value={newLeadForm.website}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="Alex Smith"
                    value={newLeadForm.contact_name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="VP of Growth"
                    value={newLeadForm.contact_title}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="alex@acme.com"
                  value={newLeadForm.contact_email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition-all"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <span>© 2026 LeadForge AI Inc. • High-ROI Outbound Intelligence Micro-SaaS</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SQLite Embedded DB</span>
            <span>•</span>
            <span>Gemini 1.5 Pro Enrichment</span>
            <span>•</span>
            <span>Stripe-Ready Tiered Billing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
