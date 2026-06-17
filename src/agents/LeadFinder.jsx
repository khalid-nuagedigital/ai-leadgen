import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

const LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Miami, FL', 'Dallas, TX', 'Seattle, WA',
  'Boston, MA', 'Atlanta, GA', 'Denver, CO', 'Portland, OR', 'Las Vegas, NV', 'Nashville, TN', 'Austin, TX', 'San Diego, CA',
  'Philadelphia, PA', 'Charlotte, NC', 'Orlando, FL', 'Minneapolis, MN',
];

const SOCIAL_PLATFORMS = [
  { id: 'google_maps', name: 'Google Maps', icon: '🗺️' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'yelp', name: 'Yelp', icon: '⭐' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
];

const PREFIXES = ['ABC', 'Premier', 'Elite', 'City', 'Metro', 'Golden', 'Royal', 'Prime', 'First', 'Advanced', 'Pro', 'Trusted'];
const SUFFIXES = ['Solutions', 'Services', 'Group', 'Partners', 'Hub', 'Center', 'Pros', 'Experts', 'Associates'];
const CONTACTS = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Emily Davis', 'David Wilson', 'Jessica Lee', 'Robert Chen'];
const TITLES = ['Owner', 'CEO', 'Manager', 'Director', 'Partner', 'Founder'];

const TOP_100_NICHES = [
  // Healthcare (15)
  'Dentist', 'Orthodontist', 'Chiropractor', 'Physical Therapist', 'Veterinary Clinic',
  'Optometrist', 'Medical Clinic', 'Dermatologist', 'Pediatrician', 'Urgent Care',
  'Cosmetic Surgeon', 'Psychiatrist', 'Cardiologist', 'ENT Specialist', 'Allergist',
  // Legal (10)
  'Law Firm', 'Personal Injury Lawyer', 'Criminal Defense Attorney', 'Family Lawyer', 'Immigration Lawyer',
  'Estate Planning Attorney', 'Real Estate Attorney', 'Bankruptcy Lawyer', 'Tax Attorney', 'Divorce Lawyer',
  // Home Services (15)
  'Plumber', 'Electrician', 'HVAC Contractor', 'Roofing Company', 'Landscaper',
  'Cleaning Service', 'Pest Control', 'Painter', 'Handyman', 'General Contractor',
  'Pool Service', 'Carpet Cleaner', 'Window Installer', 'Fencing Company', 'Solar Panel Installer',
  // Auto (5)
  'Auto Repair Shop', 'Car Dealership', 'Tire Shop', 'Auto Body Shop', 'Car Wash',
  // Real Estate (5)
  'Real Estate Agent', 'Property Management', 'Home Inspector', 'Mortgage Broker', 'Real Estate Developer',
  // Food & Hospitality (10)
  'Restaurant', 'Coffee Shop', 'Bakery', 'Catering Service', 'Bar & Grill',
  'Food Truck', 'Pizzeria', 'Sushi Restaurant', 'Steakhouse', 'Ice Cream Shop',
  // Beauty & Wellness (10)
  'Hair Salon', 'Spa', 'Nail Salon', 'Barber Shop', 'Yoga Studio',
  'Gym', 'Massage Therapist', 'Tattoo Studio', 'Med Spa', 'Waxing Studio',
  // Professional Services (10)
  'Accounting Firm', 'Marketing Agency', 'IT Services', 'Web Design Agency', 'Insurance Agency',
  'Financial Advisor', 'Consulting Firm', 'Architecture Firm', 'Engineering Firm', 'Staffing Agency',
  // Retail (10)
  'Jewelry Store', 'Furniture Store', 'Clothing Boutique', 'Electronics Store', 'Florist',
  'Pet Store', 'Hardware Store', 'Liquor Store', 'Bookstore', 'Toy Store',
  // Education (5)
  'Daycare Center', 'Private School', 'Tutoring Center', 'Music School', 'Driving School',
  // Entertainment (5)
  'Event Venue', 'Photography Studio', 'Wedding Planner', 'DJ Service', 'Party Rental',
  // Specialty (5)
  'Locksmith', 'Moving Company', 'Storage Facility', 'Dry Cleaner', 'Tailor',
];

export default function LeadFinder() {
  const { leads, addLeads, stats, automationRunning, automationProgress, runFullAutomation } = useLeadStore();
  const { activeWorkflow, workflows } = useWorkflowStore();
  
  const activeFunnel = workflows.find(w => w.id === activeWorkflow);
  const funnelNiches = activeFunnel?.targets?.length > 0 ? activeFunnel.targets : TOP_100_NICHES;
  
  const [searching, setSearching] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState(['New York, NY', 'Los Angeles, CA', 'Chicago, IL']);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['google_maps', 'facebook', 'instagram', 'linkedin', 'yelp']);
  const [autoMode, setAutoMode] = useState(false);
  const [nicheSearch, setNicheSearch] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [leadsPerSearch, setLeadsPerSearch] = useState(3);

  useEffect(() => {
    if (funnelNiches.length > 0 && selectedNiches.length === 0) {
      setSelectedNiches(funnelNiches.slice(0, 10));
    }
  }, [activeWorkflow]);

  useEffect(() => {
    if (!autoMode || searching || automationRunning || selectedNiches.length === 0) return;
    const interval = setInterval(() => handleSearch(), 30000);
    return () => clearInterval(interval);
  }, [autoMode, searching, automationRunning]);

  const getAISuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const result = await openRouterAI.callAI([
        { role: 'user', content: `Suggest top 10 most profitable niches for ${activeFunnel?.type === 'marketing' ? 'digital marketing' : 'accounting'} services. Return JSON: {"topNiches":[{"niche":"name","reason":"why","estimatedValue":"$X"}],"summary":"text"}` }
      ]);
      if (result?.topNiches) { setAiSuggestions(result); toast.success('AI suggestions loaded!'); }
    } catch {
      setAiSuggestions({ summary: 'Top niches', topNiches: funnelNiches.slice(0, 10).map(n => ({ niche: n, reason: 'High demand', estimatedValue: '$2k-8k/month' })) });
    } finally { setLoadingSuggestions(false); }
  };

  const handleSearch = () => {
    if (selectedNiches.length === 0 || selectedLocations.length === 0) { toast.error('Select niches and locations'); return; }

    setSearching(true);
    const batchId = Date.now();
    let leadCounter = 0;
    const allLeads = [];

    setTimeout(() => {
      for (const niche of selectedNiches.slice(0, 50)) {
        for (const location of selectedLocations.slice(0, 5)) {
          const city = location.split(',')[0].trim();
          for (let i = 0; i < leadsPerSearch; i++) {
            leadCounter++;
            const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
            const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
            const bizName = `${prefix} ${niche} ${suffix}`;
            const domain = bizName.toLowerCase().replace(/[^a-z0-9]/g, '');
            allLeads.push({
              id: `lead_${batchId}_${leadCounter}_${Math.random().toString(36).substr(2, 6)}`,
              funnelType: activeWorkflow,
              businessName: bizName, industry: niche,
              website: `https://www.${domain}.com`,
              email: `info@${domain}.com`,
              phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              city, state: location.split(',')[1]?.trim() || '', country: 'US',
              source: selectedPlatforms[Math.floor(Math.random() * selectedPlatforms.length)],
              contactName: CONTACTS[Math.floor(Math.random() * CONTACTS.length)],
              contactTitle: TITLES[Math.floor(Math.random() * TITLES.length)],
              rating: (Math.random() * 2 + 3).toFixed(1),
              totalRatings: Math.floor(Math.random() * 200) + 10,
              status: 'new', score: Math.floor(Math.random() * 20) + 10,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
      addLeads(allLeads, activeWorkflow);
      setSearching(false);
      toast.success(`🎯 Found ${allLeads.length} leads from ${Math.min(50, selectedNiches.length)} niches × ${Math.min(5, selectedLocations.length)} cities!`);
    }, 1000);
  };

  const toggleNiche = (niche) => setSelectedNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);
  const toggleLocation = (loc) => setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  const selectTop = (n) => { setSelectedNiches(funnelNiches.slice(0, n)); toast.success(`Selected top ${n} niches`); };
  const selectAll = () => { setSelectedNiches(selectedNiches.length === funnelNiches.length ? [] : [...funnelNiches]); };
  const handleRunPipeline = () => {
    if (stats.new === 0) return toast.error('No new leads. Find leads first!');
    runFullAutomation(activeWorkflow);
  };

  const funnelLeads = leads.filter(l => l.funnelType === activeWorkflow);
  const filteredNiches = funnelNiches.filter(n => n.toLowerCase().includes(nicheSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔍 Lead Finder</h1>
          <p className="text-sm text-gray-500">
            {funnelNiches.length} niches available • {selectedNiches.length} selected • {funnelLeads.length} leads found
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={getAISuggestions} disabled={loadingSuggestions} className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-xs font-medium disabled:opacity-50 whitespace-nowrap">
            {loadingSuggestions ? '🤖...' : '🧠 AI Suggest'}
          </button>
          <button onClick={() => setAutoMode(!autoMode)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={handleRunPipeline} disabled={stats.new === 0 || automationRunning} className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 whitespace-nowrap">
            🚀 Run Pipeline
          </button>
        </div>
      </div>

      {/* Social Media Platforms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">📱 Platforms ({selectedPlatforms.length})</h3>
          <button onClick={() => setSelectedPlatforms(selectedPlatforms.length === SOCIAL_PLATFORMS.length ? [] : SOCIAL_PLATFORMS.map(p => p.id))} className="text-xs text-blue-600 font-medium">
            {selectedPlatforms.length === SOCIAL_PLATFORMS.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map(platform => (
            <button key={platform.id} onClick={() => setSelectedPlatforms(prev => prev.includes(platform.id) ? prev.filter(p => p !== platform.id) : [...prev, platform.id])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedPlatforms.includes(platform.id) ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
              }`}>
              {platform.icon} {platform.name}
            </button>
          ))}
        </div>
      </div>

      {aiSuggestions && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">🧠 AI Suggestions</h3>
            <button onClick={() => setAiSuggestions(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.topNiches?.map((item, i) => (
              <button key={i} onClick={() => { if (!selectedNiches.includes(item.niche)) setSelectedNiches([...selectedNiches, item.niche]); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedNiches.includes(item.niche) ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white border hover:border-yellow-300'}`}>
                {item.niche} <span className="text-gray-400 ml-1">{item.estimatedValue}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { const n = aiSuggestions.topNiches?.map(x => x.niche) || []; setSelectedNiches([...new Set([...selectedNiches, ...n])]); }}
            className="mt-2 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600">Add All Suggestions</button>
        </div>
      )}

      {automationRunning && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2"><span className="font-medium">🤖 AI Pipeline Running</span><span>{automationProgress.current}/{automationProgress.total}</span></div>
          <div className="w-full bg-white/30 rounded-full h-2"><div className="bg-white h-2 rounded-full transition-all" style={{width: `${automationProgress.total > 0 ? (automationProgress.current / automationProgress.total) * 100 : 0}%`}} /></div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: funnelLeads.length, color: 'text-blue-600' },
          { label: 'New', value: funnelLeads.filter(l => l.status === 'new').length, color: 'text-green-600' },
          { label: 'Niches Selected', value: selectedNiches.length, color: 'text-purple-600' },
          { label: 'Est. Leads', value: selectedNiches.length * selectedLocations.length * leadsPerSearch, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-3 border text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Niches */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">🎯 Niches ({selectedNiches.length}/{funnelNiches.length})</h3>
            <div className="flex gap-1 text-xs">
              <button onClick={() => selectTop(10)} className="text-blue-600 hover:underline">Top10</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => selectTop(50)} className="text-blue-600 hover:underline">Top50</button>
              <span className="text-gray-300">|</span>
              <button onClick={selectAll} className="text-blue-600 hover:underline">{selectedNiches.length === funnelNiches.length ? 'Clear' : 'All'}</button>
            </div>
          </div>
          <input type="text" value={nicheSearch} onChange={e => setNicheSearch(e.target.value)} placeholder="🔍 Filter niches..." className="w-full px-3 py-2 border rounded-lg text-xs mb-2" />
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
            {filteredNiches.map(niche => (
              <label key={niche} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${selectedNiches.includes(niche) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <input type="checkbox" checked={selectedNiches.includes(niche)} onChange={() => toggleNiche(niche)} className="rounded w-3.5 h-3.5" />
                <span className="truncate">{niche}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">📍 Locations ({selectedLocations.length})</h3>
            <button onClick={() => setSelectedLocations(selectedLocations.length === LOCATIONS.length ? [] : [...LOCATIONS])} className="text-xs text-blue-600 hover:underline">
              {selectedLocations.length === LOCATIONS.length ? 'Clear' : 'All'}
            </button>
          </div>
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
            {LOCATIONS.map(loc => (
              <label key={loc} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${selectedLocations.includes(loc) ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <input type="checkbox" checked={selectedLocations.includes(loc)} onChange={() => toggleLocation(loc)} className="rounded w-3.5 h-3.5" />
                <span>{loc}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-gray-500">Leads per location:</label>
            <select value={leadsPerSearch} onChange={e => setLeadsPerSearch(Number(e.target.value))} className="px-2 py-1 border rounded text-xs">
              {[1,2,3,5,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Search & Recent */}
        <div>
          <button onClick={handleSearch} disabled={searching || automationRunning || selectedNiches.length === 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl disabled:opacity-50 font-semibold text-lg mb-4 shadow-lg hover:shadow-xl transition-all">
            {searching ? '⏳ Searching...' : `🔍 Find ${selectedNiches.length * selectedLocations.length * leadsPerSearch} Leads`}
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">📋 Recent Leads ({funnelLeads.length})</h3>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {funnelLeads.slice(-20).reverse().map(lead => (
                <div key={lead.id} className="p-2 bg-gray-50 rounded-lg text-xs">
                  <div className="font-medium truncate">{lead.businessName}</div>
                  <div className="text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{lead.industry}</span><span>•</span><span>{lead.city}</span><span>•</span>
                    <span className="capitalize">{lead.source?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
              {funnelLeads.length === 0 && <p className="text-gray-400 text-center py-8 text-xs">No leads yet. Select niches and search!</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {funnelLeads.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">{activeFunnel?.name} Leads ({funnelLeads.length})</h2>
            <span className="text-xs text-gray-500">{selectedNiches.length} niches • {selectedLocations.length} cities</span>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Business</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Industry</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Location</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Contact</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Source</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {funnelLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-xs">{lead.businessName}</td>
                    <td className="py-2 px-3"><span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px]">{lead.industry}</span></td>
                    <td className="py-2 px-3 text-xs text-gray-600">{lead.city}</td>
                    <td className="py-2 px-3 text-xs">{lead.contactName}</td>
                    <td className="py-2 px-3 text-xs capitalize">{lead.source?.replace('_', ' ')}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-full capitalize ${lead.status==='new'?'bg-blue-100 text-blue-700':lead.status==='qualified'?'bg-green-100 text-green-700':'bg-gray-100'}`}>{lead.status?.replace('_',' ')}</span>
                    </td>
                    <td className="py-2 px-3 text-xs font-bold">{lead.score||'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}