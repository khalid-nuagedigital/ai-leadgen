import { openRouterAI } from './openrouter';

// Fallback simulation when API fails
const fallbackAI = {
  analyzeWebsite: async (lead) => ({
    speedScore: Math.floor(Math.random() * 40) + 40,
    seoScore: Math.floor(Math.random() * 45) + 30,
    mobileFriendly: Math.random() > 0.4,
    hasMetaPixel: Math.random() > 0.6,
    hasAdsTracking: Math.random() > 0.7,
    hasBookingSystem: Math.random() > 0.7,
    hasLiveChat: Math.random() > 0.6,
    sslValid: Math.random() > 0.2,
    overallScore: Math.floor(Math.random() * 35) + 45,
    criticalIssues: ['Website needs optimization'],
    opportunities: ['Add booking system', 'Improve SEO'],
    summary: `${lead.businessName} has room for improvement.`,
  }),

  generateOffer: async (lead) => ({
    subject: `Growth opportunity for ${lead.businessName}`,
    body: `Hi ${lead.contactName || 'there'},\n\nI noticed ${lead.businessName} could improve online. We help ${lead.industry} businesses grow.\n\nWould you be open to a call?\n\nBest regards,\nNuage Digital Team`,
    service: 'Digital Marketing',
    painPoints: ['Online presence', 'Lead generation'],
    valueProposition: `We help ${lead.industry} businesses grow`,
    callToAction: 'Schedule a 15-minute call',
    estimatedValue: '$1,500-3,000/month',
  }),

  qualifyLead: async (lead) => {
    const score = Math.min(100, (lead.score || 30) + Math.floor(Math.random() * 30));
    return {
      score,
      category: score >= 80 ? 'Hot' : score >= 60 ? 'Warm' : 'Cool',
      revenuePotential: score >= 60 ? 'Medium' : 'Low',
      recommendation: score >= 80 ? 'Book call' : 'Nurture',
      nextBestAction: score >= 60 ? 'nurture' : 'follow_up',
    };
  },

  getBestMeetingSlots: async () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return {
      slots: [
        { date: d.toISOString().split('T')[0], time: '10:00', score: 95, reason: 'Morning' },
        { date: d.toISOString().split('T')[0], time: '14:00', score: 85, reason: 'Afternoon' },
      ],
    };
  },

  getOutreachStrategy: async () => ({ bestChannel: 'email', bestTime: '10:00 AM', bestDay: 'Tuesday', confidence: 75 }),
  
  getFollowUpStrategy: async (lead) => {
    const touchCount = lead.touchCount || 0;
    return { day: [1, 3, 7, 14, 30][touchCount] || 30, type: 'follow_up', shouldSend: touchCount < 4 };
  },
};

// Main AI Service - tries OpenAI first, falls back to simulation
export const aiService = {
  analyzeWebsite: async (lead) => {
    try { return await openRouterAI.analyzeWebsite(lead); } 
    catch (e) { console.warn('Using fallback:', e.message); return await fallbackAI.analyzeWebsite(lead); }
  },

  generateOffer: async (lead) => {
    try { return await openRouterAI.generateOffer(lead); } 
    catch (e) { console.warn('Using fallback:', e.message); return await fallbackAI.generateOffer(lead); }
  },

  qualifyLead: async (lead) => {
    try { return await openRouterAI.qualifyLead(lead); } 
    catch (e) { console.warn('Using fallback:', e.message); return await fallbackAI.qualifyLead(lead); }
  },

  getBestMeetingSlots: async (lead) => {
    try { return await openRouterAI.getBestMeetingSlots(lead); } 
    catch (e) { return await fallbackAI.getBestMeetingSlots(lead); }
  },

  getOutreachStrategy: async (lead) => await fallbackAI.getOutreachStrategy(lead),
  getFollowUpStrategy: async (lead) => await fallbackAI.getFollowUpStrategy(lead),

  generateFollowUpSequence: async (lead) => [
    { day: 1, type: 'initial', subject: `Quick idea for ${lead.businessName}` },
    { day: 3, type: 'reminder', subject: 'Following up' },
    { day: 7, type: 'case_study', subject: `How we helped a ${lead.industry} business` },
  ],

  handleLeadReply: async () => ({ reply: 'Thank you! Would you like to schedule a call?', sentiment: 'neutral', shouldEscalate: false }),
  
  generateInsights: async (stats) => [
    `Total pipeline: ${stats.total} leads`,
    `${stats.qualified} qualified leads ready for meetings`,
    'Focus follow-ups on leads that opened emails',
  ],
};

export default aiService;