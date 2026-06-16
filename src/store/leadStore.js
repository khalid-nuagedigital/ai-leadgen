import { create } from 'zustand';
import { aiService } from '../services/aiService';

export const useLeadStore = create((set, get) => ({
  leads: [],
  stats: { total: 0, new: 0, analyzed: 0, outreached: 0, qualified: 0, meetings: 0, converted: 0 },
  marketingStats: { total: 0, new: 0, analyzed: 0, outreached: 0, qualified: 0, meetings: 0, converted: 0 },
  accountingStats: { total: 0, new: 0, analyzed: 0, outreached: 0, qualified: 0, meetings: 0, converted: 0 },
  automationRunning: false,
  automationProgress: { current: 0, total: 0, agent: '', status: '' },
  aiEnabled: true,
  systemLogs: [],

  addLeads: (newLeads, funnelType = 'marketing') => {
    set((state) => ({
      leads: [...state.leads, ...newLeads.map((lead) => ({
        ...lead,
        id: lead.id || Date.now() + Math.random(),
        funnelType: lead.funnelType || funnelType,
        status: lead.status || 'new',
        createdAt: lead.createdAt || new Date().toISOString(),
        score: lead.score || 0,
        history: [],
      }))],
    }));
    get().updateStats();
    get().addLog('LeadFinder', `Added ${newLeads.length} new leads to ${funnelType} funnel`);
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
    set((state) => ({ leads: state.leads.filter((lead) => lead.id !== id) }));
    get().updateStats();
  },

  updateStats: () => {
    const leads = get().leads;
    const marketingLeads = leads.filter(l => l.funnelType === 'marketing');
    const accountingLeads = leads.filter(l => l.funnelType === 'accounting');

    set({
      stats: {
        total: leads.length,
        new: leads.filter((l) => l.status === 'new').length,
        analyzed: leads.filter((l) => l.status === 'analyzed').length,
        outreached: leads.filter((l) => l.status === 'outreached').length,
        qualified: leads.filter((l) => l.status === 'qualified').length,
        meetings: leads.filter((l) => l.status === 'meeting_booked').length,
        converted: leads.filter((l) => l.status === 'converted').length,
      },
      marketingStats: {
        total: marketingLeads.length,
        new: marketingLeads.filter((l) => l.status === 'new').length,
        analyzed: marketingLeads.filter((l) => l.status === 'analyzed').length,
        outreached: marketingLeads.filter((l) => l.status === 'outreached').length,
        qualified: marketingLeads.filter((l) => l.status === 'qualified').length,
        meetings: marketingLeads.filter((l) => l.status === 'meeting_booked').length,
        converted: marketingLeads.filter((l) => l.status === 'converted').length,
      },
      accountingStats: {
        total: accountingLeads.length,
        new: accountingLeads.filter((l) => l.status === 'new').length,
        analyzed: accountingLeads.filter((l) => l.status === 'analyzed').length,
        outreached: accountingLeads.filter((l) => l.status === 'outreached').length,
        qualified: accountingLeads.filter((l) => l.status === 'qualified').length,
        meetings: accountingLeads.filter((l) => l.status === 'meeting_booked').length,
        converted: accountingLeads.filter((l) => l.status === 'converted').length,
      },
    });
  },

  getLeadsByFunnel: (funnelType) => {
    return get().leads.filter(l => l.funnelType === funnelType);
  },

  addLog: (agent, message) => {
    set((state) => ({
      systemLogs: [{
        id: Date.now(),
        agent,
        message,
        timestamp: new Date().toISOString(),
      }, ...state.systemLogs].slice(0, 50),
    }));
  },

  setAutomationRunning: (running) => set({ automationRunning: running }),
  setAutomationProgress: (progress) => set({ automationProgress: progress }),
  toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),

  // Run full AI automation for a specific funnel
  runFullAutomation: async (funnelType = 'marketing') => {
    const state = get();
    if (state.automationRunning) return;
    
    set({ automationRunning: true });
    get().addLog('System', `🤖 Full AI automation started for ${funnelType} funnel`);
    
    try {
      const funnelLeads = state.leads.filter(l => l.funnelType === funnelType);
      
      // Agent 2: Analyze new leads
      const newLeads = funnelLeads.filter(l => l.status === 'new');
      if (newLeads.length > 0) {
        set({ automationProgress: { current: 0, total: newLeads.length, agent: 'Website Analyzer', status: 'Analyzing...' } });
        
        for (let i = 0; i < newLeads.length; i++) {
          set({ automationProgress: { current: i + 1, total: newLeads.length, agent: 'Website Analyzer', status: `Analyzing ${newLeads[i].businessName}...` } });
          const analysis = await aiService.analyzeWebsite(newLeads[i]);
          get().updateLead(newLeads[i].id, {
            status: 'analyzed',
            websiteSpeedScore: analysis.speedScore,
            seoScore: analysis.seoScore,
            mobileFriendly: analysis.mobileFriendly,
            hasMetaPixel: analysis.hasMetaPixel,
            hasBookingSystem: analysis.hasBookingSystem,
            analysisJson: analysis,
            score: analysis.overallScore,
          });
        }
      }

      // Agent 3 & 4: Generate offers and send outreach
      const analyzedLeads = get().leads.filter(l => l.funnelType === funnelType && l.status === 'analyzed' && !l.personalizedOffer);
      if (analyzedLeads.length > 0) {
        set({ automationProgress: { current: 0, total: analyzedLeads.length, agent: 'Offer + Outreach', status: 'Processing...' } });
        
        for (let i = 0; i < analyzedLeads.length; i++) {
          const offer = await aiService.generateOffer(analyzedLeads[i]);
          get().updateLead(analyzedLeads[i].id, {
            status: 'outreached',
            personalizedOffer: JSON.stringify(offer),
            recommendedService: offer.service,
            firstEmailSentAt: new Date().toISOString(),
            touchCount: 1,
          });
        }
      }

      // Agent 6: Qualify leads
      const toQualify = get().leads.filter(l => l.funnelType === funnelType && (l.status === 'outreached' || l.status === 'nurturing'));
      if (toQualify.length > 0) {
        set({ automationProgress: { current: 0, total: toQualify.length, agent: 'Qualification', status: 'Scoring...' } });
        
        for (let i = 0; i < toQualify.length; i++) {
          const qualification = await aiService.qualifyLead(toQualify[i]);
          get().updateLead(toQualify[i].id, {
            status: qualification.score >= 60 ? 'qualified' : 'nurturing',
            qualificationScore: qualification.score,
            score: qualification.score,
          });
        }
      }

      // Agent 7: Book meetings
      const qualified = get().leads.filter(l => l.funnelType === funnelType && l.status === 'qualified' && !l.meetingScheduledAt);
      if (qualified.length > 0) {
        set({ automationProgress: { current: 0, total: qualified.length, agent: 'Appointment', status: 'Scheduling...' } });
        
        for (let i = 0; i < qualified.length; i++) {
          const meeting = await aiService.getBestMeetingSlots(qualified[i]);
          const slot = meeting.slots?.[0] || meeting.recommended;
          if (slot) {
            get().updateLead(qualified[i].id, {
              status: 'meeting_booked',
              meetingScheduledAt: `${slot.date}T${slot.time}`,
            });
          }
        }
      }

      get().addLog('System', `🎉 ${funnelType} funnel automation completed!`);
    } catch (error) {
      get().addLog('System', `❌ Error: ${error.message}`);
    } finally {
      set({ automationRunning: false, automationProgress: { current: 0, total: 0, agent: 'Complete', status: 'Done' } });
      get().updateStats();
    }
  },
}));

export default useLeadStore;