import { create } from 'zustand';
import { aiService } from '../services/aiService';

export const useLeadStore = create((set, get) => ({
  // ============ STATE ============
  leads: [],
  stats: { total: 0, new: 0, analyzed: 0, outreached: 0, qualified: 0, meetings: 0, converted: 0 },
  marketingStats: { total: 0, new: 0, analyzed: 0, outreached: 0, qualified: 0, meetings: 0, converted: 0 },
  accountingStats: { total: 0, new: 0, analyzed: 0, outreached: 0, qualified: 0, meetings: 0, converted: 0 },
  automationRunning: false,
  automationProgress: { current: 0, total: 0, agent: '', status: '' },
  aiEnabled: true,
  systemLogs: [],

  // ============ LEAD MANAGEMENT ============

  addLeads: (newLeads, funnelType = 'marketing') => {
    const timestamp = Date.now();
    set((state) => ({
      leads: [
        ...state.leads,
        ...newLeads.map((lead, index) => ({
          ...lead,
          id: lead.id || `${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          funnelType: lead.funnelType || funnelType,
          status: lead.status || 'new',
          createdAt: lead.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          score: lead.score || 0,
          history: lead.history || [],
        })),
      ],
    }));
    get().updateStats();
    get().addLog('LeadFinder', `Added ${newLeads.length} leads to ${funnelType} funnel`);
  },

  updateLead: (id, updates) => {
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString() } : lead
      ),
    }));
    get().updateStats();
  },

  deleteLead: (id) => {
    const lead = get().leads.find((l) => l.id === id);
    set((state) => ({ leads: state.leads.filter((l) => l.id !== id) }));
    get().updateStats();
    if (lead) get().addLog('System', `Deleted: ${lead.businessName}`);
  },

  deleteMultipleLeads: (ids) => {
    set((state) => ({ leads: state.leads.filter((l) => !ids.includes(l.id)) }));
    get().updateStats();
    get().addLog('System', `Deleted ${ids.length} leads`);
  },

  clearAllLeads: () => {
    set({ leads: [] });
    get().updateStats();
    get().addLog('System', 'All leads cleared');
  },

  // ============ STATS ============

  updateStats: () => {
    const allLeads = get().leads;
    const marketing = allLeads.filter((l) => l.funnelType === 'marketing');
    const accounting = allLeads.filter((l) => l.funnelType === 'accounting');

    const countByStatus = (leads, status) => leads.filter((l) => l.status === status).length;

    set({
      stats: {
        total: allLeads.length,
        new: countByStatus(allLeads, 'new'),
        analyzed: countByStatus(allLeads, 'analyzed'),
        outreached: countByStatus(allLeads, 'outreached'),
        qualified: countByStatus(allLeads, 'qualified'),
        meetings: countByStatus(allLeads, 'meeting_booked'),
        converted: countByStatus(allLeads, 'converted'),
      },
      marketingStats: {
        total: marketing.length,
        new: countByStatus(marketing, 'new'),
        analyzed: countByStatus(marketing, 'analyzed'),
        outreached: countByStatus(marketing, 'outreached'),
        qualified: countByStatus(marketing, 'qualified'),
        meetings: countByStatus(marketing, 'meeting_booked'),
        converted: countByStatus(marketing, 'converted'),
      },
      accountingStats: {
        total: accounting.length,
        new: countByStatus(accounting, 'new'),
        analyzed: countByStatus(accounting, 'analyzed'),
        outreached: countByStatus(accounting, 'outreached'),
        qualified: countByStatus(accounting, 'qualified'),
        meetings: countByStatus(accounting, 'meeting_booked'),
        converted: countByStatus(accounting, 'converted'),
      },
    });
  },

  getLeadsByFunnel: (funnelType) => get().leads.filter((l) => l.funnelType === funnelType),

  getLeadsByStatus: (status, funnelType) => {
    let leads = get().leads.filter((l) => l.status === status);
    if (funnelType) leads = leads.filter((l) => l.funnelType === funnelType);
    return leads;
  },

  getLeadById: (id) => get().leads.find((l) => l.id === id),

  // ============ LOGS ============

  addLog: (agent, message) => {
    set((state) => ({
      systemLogs: [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          agent,
          message,
          timestamp: new Date().toISOString(),
        },
        ...state.systemLogs,
      ].slice(0, 100),
    }));
  },

  clearLogs: () => set({ systemLogs: [] }),

  // ============ AUTOMATION CONTROLS ============

  setAutomationRunning: (running) => set({ automationRunning: running }),
  setAutomationProgress: (progress) => set({ automationProgress: progress }),
  toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),

  // ============ FULL AUTOMATION PIPELINE ============

  runFullAutomation: async (funnelType = 'marketing') => {
    if (get().automationRunning) return;

    set({ automationRunning: true });
    get().addLog('System', `🤖 AI pipeline started for ${funnelType} funnel`);

    try {
      await get().runAgentAnalyze(funnelType);
      await get().runAgentOfferOutreach(funnelType);
      await get().runAgentFollowUp(funnelType);
      await get().runAgentQualify(funnelType);
      await get().runAgentBookMeetings(funnelType);

      get().addLog('System', `🎉 ${funnelType} pipeline completed!`);
    } catch (error) {
      get().addLog('System', `❌ Error: ${error.message}`);
    } finally {
      set({
        automationRunning: false,
        automationProgress: { current: 0, total: 0, agent: 'Complete ✅', status: 'Done' },
      });
      get().updateStats();
    }
  },

  // ============ INDIVIDUAL AGENTS ============

  runAgentAnalyze: async (funnelType) => {
    const newLeads = get().leads.filter((l) => l.funnelType === funnelType && l.status === 'new');
    if (newLeads.length === 0) return;

    set({ automationProgress: { current: 0, total: newLeads.length, agent: '🌐 Website Analyzer', status: 'Analyzing...' } });

    for (let i = 0; i < newLeads.length; i++) {
      const lead = newLeads[i];
      set({ automationProgress: { current: i + 1, total: newLeads.length, agent: '🌐 Website Analyzer', status: lead.businessName } });

      try {
        const analysis = await aiService.analyzeWebsite(lead);
        get().updateLead(lead.id, {
          status: 'analyzed',
          websiteSpeedScore: analysis.speedScore || analysis.overallScore || 50,
          seoScore: analysis.seoScore || 50,
          mobileFriendly: analysis.mobileFriendly ?? false,
          hasMetaPixel: analysis.hasMetaPixel ?? false,
          hasAdsTracking: analysis.hasAdsTracking ?? false,
          hasBookingSystem: analysis.hasBookingSystem ?? false,
          hasLiveChat: analysis.hasLiveChat ?? false,
          sslValid: analysis.sslValid ?? true,
          analysisJson: { ...analysis, analyzedAt: new Date().toISOString() },
          score: analysis.overallScore || Math.floor(Math.random() * 30) + 40,
        });
        get().addLog('Agent 2', `✅ ${lead.businessName} (${analysis.overallScore || 'N/A'})`);
      } catch (e) {
        get().addLog('Agent 2', `❌ ${lead.businessName}`);
      }
    }
  },

  runAgentOfferOutreach: async (funnelType) => {
    const analyzedLeads = get().leads.filter(
      (l) => l.funnelType === funnelType && l.status === 'analyzed' && !l.personalizedOffer
    );
    if (analyzedLeads.length === 0) return;

    set({ automationProgress: { current: 0, total: analyzedLeads.length, agent: '📝 Offer + 📧 Outreach', status: 'Processing...' } });

    for (let i = 0; i < analyzedLeads.length; i++) {
      const lead = analyzedLeads[i];
      set({ automationProgress: { current: i + 1, total: analyzedLeads.length, agent: '📝 Offer + 📧 Outreach', status: lead.businessName } });

      try {
        const offer = await aiService.generateOffer(lead);
        get().updateLead(lead.id, {
          status: 'outreached',
          personalizedOffer: JSON.stringify(offer),
          recommendedService: offer.service || 'Digital Marketing',
          painPoints: offer.painPoints || [],
          firstEmailSentAt: new Date().toISOString(),
          lastTouchAt: new Date().toISOString(),
          touchCount: 1,
          outreachChannel: 'email',
        });
        get().addLog('Agent 3+4', `📧 ${lead.businessName}`);
      } catch (e) {
        get().addLog('Agent 3+4', `❌ ${lead.businessName}`);
      }
    }
  },

  runAgentFollowUp: async (funnelType) => {
    const needsFollowUp = get().leads.filter(
      (l) => l.funnelType === funnelType && l.status === 'outreached' && (l.touchCount || 0) < 4
    );
    if (needsFollowUp.length === 0) return;

    set({ automationProgress: { current: 0, total: needsFollowUp.length, agent: '🔄 Follow-Up', status: 'Sending...' } });

    for (let i = 0; i < needsFollowUp.length; i++) {
      const lead = needsFollowUp[i];
      try {
        const strategy = await aiService.getFollowUpStrategy(lead);
        if (strategy.shouldSend) {
          get().updateLead(lead.id, {
            touchCount: (lead.touchCount || 0) + 1,
            lastTouchAt: new Date().toISOString(),
          });
          get().addLog('Agent 5', `🔄 Follow-up #${(lead.touchCount || 0) + 1}: ${lead.businessName}`);
        }
      } catch (e) {
        get().addLog('Agent 5', `❌ ${lead.businessName}`);
      }
    }
  },

  runAgentQualify: async (funnelType) => {
    const toQualify = get().leads.filter(
      (l) => l.funnelType === funnelType && (l.status === 'outreached' || l.status === 'nurturing')
    );
    if (toQualify.length === 0) return;

    set({ automationProgress: { current: 0, total: toQualify.length, agent: '✅ Qualification', status: 'Scoring...' } });

    for (let i = 0; i < toQualify.length; i++) {
      const lead = toQualify[i];
      set({ automationProgress: { current: i + 1, total: toQualify.length, agent: '✅ Qualification', status: lead.businessName } });

      try {
        const qualification = await aiService.qualifyLead(lead);
        const score = qualification.score || Math.floor(Math.random() * 40) + 40;
        get().updateLead(lead.id, {
          status: score >= 60 ? 'qualified' : 'nurturing',
          qualificationScore: score,
          score: score,
          qualificationNotes: qualification.recommendation || '',
        });
        get().addLog('Agent 6', `✅ ${lead.businessName} (${score}/100)`);
      } catch (e) {
        get().addLog('Agent 6', `❌ ${lead.businessName}`);
      }
    }
  },

  runAgentBookMeetings: async (funnelType) => {
    const qualified = get().leads.filter(
      (l) => l.funnelType === funnelType && l.status === 'qualified' && !l.meetingScheduledAt
    );
    if (qualified.length === 0) return;

    set({ automationProgress: { current: 0, total: qualified.length, agent: '📅 Appointments', status: 'Scheduling...' } });

    for (let i = 0; i < qualified.length; i++) {
      const lead = qualified[i];
      try {
        const meeting = await aiService.getBestMeetingSlots(lead);
        const slot = meeting?.slots?.[0] || meeting?.recommended;
        if (slot) {
          get().updateLead(lead.id, {
            status: 'meeting_booked',
            meetingScheduledAt: `${slot.date}T${slot.time}`,
            calendlyEventUri: `https://calendly.com/events/${Date.now()}`,
          });
          get().addLog('Agent 7', `📅 ${lead.businessName} on ${slot.date} at ${slot.time}`);
        }
      } catch (e) {
        get().addLog('Agent 7', `❌ ${lead.businessName}`);
      }
    }
  },

  // ============ SINGLE LEAD PROCESSING ============

  processSingleLead: async (leadId, agentId) => {
    const lead = get().leads.find((l) => l.id === leadId);
    if (!lead) return;

    try {
      switch (agentId) {
        case 2: {
          const analysis = await aiService.analyzeWebsite(lead);
          get().updateLead(leadId, { status: 'analyzed', analysisJson: analysis, score: analysis.overallScore || 50 });
          break;
        }
        case 3: {
          const offer = await aiService.generateOffer(lead);
          get().updateLead(leadId, { personalizedOffer: JSON.stringify(offer), recommendedService: offer.service });
          break;
        }
        case 4:
          get().updateLead(leadId, { status: 'outreached', firstEmailSentAt: new Date().toISOString(), touchCount: 1 });
          break;
        case 6: {
          const qualification = await aiService.qualifyLead(lead);
          get().updateLead(leadId, { status: qualification.score >= 60 ? 'qualified' : 'nurturing', qualificationScore: qualification.score });
          break;
        }
        case 7: {
          const meeting = await aiService.getBestMeetingSlots(lead);
          const slot = meeting?.slots?.[0];
          if (slot) get().updateLead(leadId, { status: 'meeting_booked', meetingScheduledAt: `${slot.date}T${slot.time}` });
          break;
        }
        default: break;
      }
      get().addLog(`Agent ${agentId}`, `✅ Processed: ${lead.businessName}`);
    } catch (e) {
      get().addLog(`Agent ${agentId}`, `❌ ${lead.businessName}`);
    }
    get().updateStats();
  },

  // ============ IMPORT / EXPORT ============

  exportLeads: (format = 'csv') => {
    const leads = get().leads;
    if (leads.length === 0) return null;
    if (format === 'csv') {
      const headers = ['Business Name', 'Industry', 'Website', 'Email', 'Phone', 'City', 'Status', 'Score', 'Source', 'Funnel'];
      const rows = leads.map((l) => [l.businessName, l.industry, l.website, l.email, l.phone, l.city, l.status, l.score, l.source, l.funnelType]);
      return [headers, ...rows].map((r) => r.join(',')).join('\n');
    }
    if (format === 'json') return JSON.stringify(leads, null, 2);
    return null;
  },

  importLeads: (data, funnelType = 'marketing') => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (Array.isArray(parsed)) { get().addLeads(parsed, funnelType); return true; }
      return false;
    } catch { return false; }
  },
}));

export default useLeadStore;