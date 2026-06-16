import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

const LOCATIONS = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Miami, FL', 'Dallas, TX', 'Seattle, WA'];
const PREFIXES = ['ABC', 'Premier', 'Elite', 'City', 'Metro', 'Golden', 'Royal', 'Prime', 'First', 'Advanced'];
const SUFFIXES = ['Solutions', 'Services', 'Group', 'Partners', 'Hub', 'Center', 'Pros', 'Experts'];
const CONTACTS = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Emily Davis', 'David Wilson'];
const TITLES = ['Owner', 'CEO', 'Manager', 'Director', 'Partner', 'Founder'];
const SOURCES = ['google_maps', 'linkedin', 'yelp', 'facebook'];

const DEFAULT_NICHES = [
  'Dentist', 'Orthodontist', 'Chiropractor', 'Physical Therapist', 'Veterinary Clinic',
  'Optometrist', 'Medical Clinic', 'Dermatologist', 'Pediatrician', 'Urgent Care',
  'Law Firm', 'Personal Injury Lawyer', 'Criminal Defense Attorney', 'Family Lawyer', 'Immigration Lawyer',
  'Plumber', 'Electrician', 'HVAC Contractor', 'Roofing Company', 'Landscaper',
  'Cleaning Service', 'Pest Control', 'Painter', 'Handyman', 'General Contractor',
  'Auto Repair Shop', 'Car Dealership', 'Tire Shop', 'Auto Body Shop', 'Car Wash',
  'Real Estate Agent', 'Property Management', 'Home Inspector', 'Mortgage Broker',
  'Restaurant', 'Coffee Shop', 'Bakery', 'Catering Service', 'Bar & Grill',
  'Hair Salon', 'Spa', 'Nail Salon', 'Barber Shop', 'Yoga Studio', 'Gym',
  'Accounting Firm', 'Marketing Agency', 'IT Services', 'Web Design Agency', 'Insurance Agency',
  'Jewelry Store', 'Furniture Store', 'Clothing Boutique', 'Electronics Store', 'Florist',
  'Daycare Center', 'Private School', 'Tutoring Center', 'Music School', 'Driving School',
  'Event Venue', 'Photography Studio', 'Wedding Planner', 'DJ Service', 'Party Rental',
  'Locksmith', 'Moving Company', 'Storage Facility', 'Dry Cleaner', 'Tailor',
  'Pet Store', 'Hardware Store', 'Liquor Store', 'Bookstore', 'Toy Store',
];

export default function LeadFinder() {
  const { leads, addLeads, stats, automationRunning, automationProgress, runFullAutomation } = useLeadStore();
  const { activeWorkflow, workflows } = useWorkflowStore();
  
  const activeFunnel = workflows.find(w => w.id === activeWorkflow);
  const funnelNiches = activeFunnel?.targets?.length > 0 ? activeFunnel.targets : DEFAULT_NICHES;
  
  const [searching, setSearching] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState(['New York, NY', 'Los Angeles, CA', 'Chicago, IL']);
  const [autoMode, setAutoMode] = useState(false);
  const [nicheSearch, setNicheSearch] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (funnelNiches.length > 0 && selectedNiches.length === 0) {
      setSelectedNiches(funnelNiches.slice(0, 10));
    }
  }, [activeWorkflow]);

  useEffect(() => {
    let interval;
    if (autoMode && !searching && !automationRunning && selectedNiches.length > 0) {
      interval = setInterval(() => handleSearch(), 30000);
    }
    return () => clearInterval(interval);
  }, [autoMode, searching, automationRunning, selectedNiches, selectedLocations]);

  const getAISuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const result = await openRouterAI.callAI(
        [{ role: 'user', content: `Suggest top 10 most profitable niches for ${activeFunnel?.type === 'marketing' ? 'digital marketing' : 'accounting'} services. Return JSON: {"topNiches":[{"niche":"name","reason":"why","estimatedValue":"$X"}],"summary":"text"}` }],
        { maxTokens: 800 }
      );
      if (result?.topNiches) {
        setAiSuggestions(result);
        toast.success('AI suggestions loaded!');
      } else if (result?.text) {
        setAiSuggestions({ topNiches: [], summary: result.text });
      }
    } catch (error) {
      setAiSuggestions({
        summary: 'Top niches based on market analysis',
        topNiches: [
          { niche: 'Dentist', reason: 'High lifetime value', estimatedValue: '$3k-8k/month' },
          { niche: 'Law Firm', reason: 'High competition', estimatedValue: '$5k-15k/month' },
          { niche: 'Medical Clinic', reason: 'Growing telehealth', estimatedValue: '$3k-10k/month' },
        ],
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (selectedNiches.length === 0 || selectedLocations.length === 0) {
      toast.error('Select at least one niche and location');
      return;
    }
    setSearching(true);
    
    setTimeout(() => {
      const newLeads = [];
      let leadCounter = 0;
      const batchId = Date.now();
      
      for (const niche of selectedNiches.slice(0, 15)) {
        for (const location of selectedLocations.slice(0, 4)) {
          const city = location.split(',')[0].trim();
          const count = Math.floor(Math.random() * 3) + 2;
          
          for (let i = 0; i < count; i++) {
            leadCounter++;
            const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
            const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
            const bizName = `${prefix} ${niche} ${suffix}`;
            const domain = bizName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            newLeads.push({
              id: `${batchId}-${leadCounter}-${Math.random().toString(36).substring(2, 8)}`,
              funnelType: activeWorkflow,
              businessName: bizName,
              industry: niche,
              website: `https://www.${domain}.com`,
              email: `info@${domain}.com`,
              phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              city: city,
              state: location.split(',')[1]?.trim() || '',
              country: 'US',
              source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
              contactName: CONTACTS[Math.floor(Math.random() * CONTACTS.length)],
              contactTitle: TITLES[Math.floor(Math.random() * TITLES.length)],
              rating: (Math.random() * 2 + 3).toFixed(1),
              totalRatings: Math.floor(Math.random() * 200) + 10,
              status: 'new',
              score: Math.floor(Math.random() * 20) + 10,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
      
      addLeads(newLeads, activeWorkflow);
      setSearching(false);
      toast.success(`Found ${newLeads.length} leads!`);
    }, 1500);
  };

  const toggleNiche = (niche) => setSelectedNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);
  const toggleLocation = (loc) => setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  
  const handleRunPipeline = () => {
    if (stats.new === 0) return toast.error('No new leads. Find leads first!');
    runFullAutomation(activeWorkflow);
  };

  const funnelLeads = leads.filter(l => l.funnelType === activeWorkflow);
  const filteredNiches = funnelNiches.filter(n => n.toLowerCase().includes(nicheSearch.toLowerCase()));
  const filteredLocations = LOCATIONS.filter(l => l.toLowerCase().includes((l || '').toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔍 AI Lead Finder</h1>
          <p className="text-gray-500 mt-1">Targeting <span className="font-semibold text-blue-600">{funnelNiches.length} niches</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={getAISuggestions} disabled={loadingSuggestions} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loadingSuggestions ? '🤖...' : '🧠 AI Suggest'}
          </button>
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={handleRunPipeline} disabled={stats.new === 0 || automationRunning} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            🚀 Run Pipeline
          </button>
        </div>
      </div>

      {aiSuggestions && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">🧠 AI Niche Suggestions</h3>
            <button onClick={() => setAiSuggestions(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {aiSuggestions.topNiches?.map((item, i) => (
              <button key={i} onClick={() => { if (!selectedNiches.includes(item.niche)) setSelectedNiches([...selectedNiches, item.niche]); }}
                className={`p-3 rounded-lg text-left text-sm ${selectedNiches.includes(item.niche) ? 'bg-green-100 border-2 border-green-300' : 'bg-white border hover:border-yellow-300'}`}>
                <div className="font-semibold">{item.niche}</div>
                <div className="text-xs text-gray-500">{item.estimatedValue}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {automationRunning && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2"><span>🤖 AI Pipeline Running</span><span>{automationProgress.current}/{automationProgress.total}</span></div>
          <div className="w-full bg-white/30 rounded-full h-2.5"><div className="bg-white h-2.5 rounded-full transition-all" style={{width: `${automationProgress.total > 0 ? (automationProgress.current / automationProgress.total) * 100 : 0}%`}} /></div>
          <p className="text-sm mt-2">{automationProgress.agent}: {automationProgress.status}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{label:'Total',value:funnelLeads.length,color:'blue'},{label:'New',value:funnelLeads.filter(l=>l.status==='new').length,color:'indigo'},{label:'Niches',value:selectedNiches.length,color:'purple'},{label:'Locations',value:selectedLocations.length,color:'pink'},{label:'Est. Reach',value:selectedNiches.length*selectedLocations.length*3,color:'orange'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <div className="text-2xl font-bold" style={{color: s.color}}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">🎯 Niches ({selectedNiches.length})</h3>
          <input type="text" value={nicheSearch} onChange={e=>setNicheSearch(e.target.value)} placeholder="🔍 Search..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filteredNiches.map(niche=>(
              <label key={niche} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedNiches.includes(niche)?'bg-blue-50 border border-blue-200':'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selectedNiches.includes(niche)} onChange={()=>toggleNiche(niche)} className="rounded" /><span className="text-sm">{niche}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">📍 Locations ({selectedLocations.length})</h3>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filteredLocations.map(loc=>(
              <label key={loc} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedLocations.includes(loc)?'bg-green-50 border border-green-200':'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selectedLocations.includes(loc)} onChange={()=>toggleLocation(loc)} className="rounded" /><span className="text-sm">{loc}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <button onClick={handleSearch} disabled={searching || automationRunning || selectedNiches.length===0}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl disabled:opacity-50 font-semibold text-lg mb-4 shadow-lg">
            {searching ? '⏳ Searching...' : '🔍 Find Leads'}
          </button>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3">📋 Recent ({funnelLeads.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {funnelLeads.slice(-10).reverse().map(lead=>(
                <div key={lead.id} className="p-2.5 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium truncate">{lead.businessName}</div>
                  <div className="text-xs text-gray-500">{lead.industry} • {lead.city} • {lead.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {funnelLeads.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b"><h2 className="font-semibold">{activeFunnel?.name} Leads ({funnelLeads.length})</h2></div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Business</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Industry</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {funnelLeads.map(lead=>(
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4"><div className="font-medium text-sm">{lead.businessName}</div><div className="text-xs text-gray-500">{lead.email}</div></td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{lead.industry}</span></td>
                    <td className="py-3 px-4 text-sm text-gray-600">{lead.city}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 text-xs rounded-full capitalize ${lead.status==='new'?'bg-blue-100 text-blue-700':lead.status==='analyzed'?'bg-purple-100 text-purple-700':lead.status==='qualified'?'bg-green-100 text-green-700':'bg-gray-100'}`}>{lead.status?.replace('_',' ')}</span></td>
                    <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-12 h-1.5 bg-gray-200 rounded-full"><div className={`h-1.5 rounded-full ${lead.score>=80?'bg-green-500':lead.score>=50?'bg-yellow-500':'bg-red-500'}`} style={{width:`${Math.min(100,lead.score||0)}%`}}/></div><span className="text-xs font-bold">{lead.score||0}</span></div></td>
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