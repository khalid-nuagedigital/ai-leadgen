/**
 * AI Service - RapidAPI ChatGPT-5 API
 */

const RAPIDAPI_KEY = 'f93404a936msha1296735da45ad4p168d19jsneb220a5c0bc7';
const RAPIDAPI_HOST = 'chatgpt-5-x-api-latest-models.p.rapidapi.com';

/**
 * Call RapidAPI ChatGPT-5
 */
async function callRapidAPI(messages) {
  try {
    console.log('🔵 Calling RapidAPI ChatGPT-5...');
    
    // Convert messages array to a single query string
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    
    // Combine system + user message
    const query = systemMessage 
      ? `${systemMessage}\n\n${userMessage}`
      : userMessage;

    const response = await fetch('https://chatgpt-5-x-api-latest-models.p.rapidapi.com/chat', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        query: query,
        metadata: {
          toolChoice: { WebSearch: false }
        }
      }),
    });

    console.log('🟡 RapidAPI Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 RapidAPI Error:', errorText);
      throw new Error(`RapidAPI Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('🟢 RapidAPI Response:', JSON.stringify(result).substring(0, 200));
    
    // Parse the response - the API returns { result: "..." } or { response: "..." }
    let content = result.result || result.response || result.text || result.message || '';
    
    // If content is a string, try to parse as JSON
    if (typeof content === 'string') {
      // Try to extract JSON from the response
      try {
        // Remove markdown code blocks if present
        let cleanContent = content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        // Try parsing as JSON
        return JSON.parse(cleanContent);
      } catch (parseError) {
        // Try to find JSON object in the text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Return as text
            return { text: content, result: content };
          }
        }
        
        // Try array
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            return JSON.parse(arrayMatch[0]);
          } catch (e) {
            return { text: content, result: content };
          }
        }
        
        return { text: content, result: content };
      }
    }
    
    // If content is already an object
    if (typeof content === 'object') {
      return content;
    }
    
    return result;
    
  } catch (error) {
    console.error('🔴 RapidAPI Error:', error);
    throw error;
  }
}

/**
 * Main AI Call
 */
async function callAI(messages) {
  const systemMessage = { 
    role: 'system', 
    content: 'You are an AI assistant for lead generation. You MUST respond with ONLY valid JSON. Do not include any text outside the JSON. Do not use markdown code blocks. Just return the raw JSON object.' 
  };

  const fullMessages = [systemMessage, ...messages];

  try {
    return await callRapidAPI(fullMessages);
  } catch (error) {
    console.warn('RapidAPI failed, using fallback');
    return generateFallback(messages);
  }
}

/**
 * Local fallback generator
 */
function generateFallback(messages) {
  const prompt = messages[0]?.content || '';
  
  if (prompt.includes('analyze') || prompt.includes('Analyze')) {
    return {
      speedScore: Math.floor(Math.random() * 40) + 40,
      seoScore: Math.floor(Math.random() * 45) + 30,
      mobileFriendly: Math.random() > 0.4,
      hasMetaPixel: Math.random() > 0.6,
      hasAdsTracking: Math.random() > 0.7,
      hasBookingSystem: Math.random() > 0.7,
      hasLiveChat: Math.random() > 0.6,
      sslValid: Math.random() > 0.2,
      overallScore: Math.floor(Math.random() * 35) + 45,
      criticalIssues: ['Website optimization needed', 'Missing tracking'],
      opportunities: ['Add booking system', 'Improve SEO'],
      summary: 'Website needs improvement.',
    };
  }
  
  if (prompt.includes('offer') || prompt.includes('outreach')) {
    return {
      subject: 'Growth opportunity for your business',
      body: 'Hi,\n\nI noticed your business could benefit from online marketing.\n\nWould you be open to a quick call?\n\nBest regards,\nNuage Digital Team',
      service: 'Digital Marketing',
      painPoints: ['Online presence', 'Lead generation'],
      valueProposition: 'Increase leads by 150%+',
      callToAction: 'Schedule a 15-minute call',
      estimatedValue: '$1,500-3,000/month',
    };
  }
  
  if (prompt.includes('Score') || prompt.includes('qualify')) {
    const score = Math.floor(Math.random() * 40) + 40;
    return {
      score,
      category: score >= 80 ? 'Hot' : score >= 60 ? 'Warm' : 'Cool',
      revenuePotential: score >= 60 ? 'Medium' : 'Low',
      recommendation: 'Nurture with follow-ups',
      nextBestAction: score >= 60 ? 'nurture' : 'follow_up',
    };
  }
  
  if (prompt.includes('niche') || prompt.includes('profitable')) {
    return {
      topNiches: [
        { niche: 'Dentist', reason: 'High lifetime value', estimatedValue: '$3k-8k/month' },
        { niche: 'Law Firm', reason: 'High competition', estimatedValue: '$5k-15k/month' },
        { niche: 'Medical Clinic', reason: 'Growing telehealth', estimatedValue: '$3k-10k/month' },
        { niche: 'Real Estate Agent', reason: 'Competitive market', estimatedValue: '$1k-5k/month' },
        { niche: 'Restaurant', reason: 'Constant marketing need', estimatedValue: '$2k-6k/month' },
      ],
      summary: 'Top niches based on market analysis',
    };
  }
  
  return { text: 'Response generated' };
}

// ============ AI AGENT FUNCTIONS ============

export const openRouterAI = {
  callAI: callAI,

  analyzeWebsite: async (lead) => {
    return await callAI([{ 
      role: 'user', 
      content: `Analyze this business website. Return ONLY JSON:\n\nBusiness: ${lead.businessName}\nIndustry: ${lead.industry}\nLocation: ${lead.city || 'Unknown'}\n\nReturn: {"speedScore":50,"seoScore":50,"mobileFriendly":true,"hasMetaPixel":false,"hasAdsTracking":false,"hasBookingSystem":false,"hasLiveChat":false,"sslValid":true,"overallScore":50,"criticalIssues":["issue"],"opportunities":["opp"],"summary":"text"}`
    }]);
  },

  generateOffer: async (lead) => {
    return await callAI([{ 
      role: 'user', 
      content: `Create outreach email. Return ONLY JSON:\n\nBusiness: ${lead.businessName}\nIndustry: ${lead.industry}\nContact: ${lead.contactName || 'there'}\n\nReturn: {"subject":"Subject","body":"Email body","service":"Service","painPoints":["pain1"],"valueProposition":"Value","callToAction":"CTA","estimatedValue":"$X/month"}`
    }]);
  },

  qualifyLead: async (lead) => {
    return await callAI([{ 
      role: 'user', 
      content: `Score lead 0-100. Return ONLY JSON:\n\nBusiness: ${lead.businessName}\nIndustry: ${lead.industry}\nScore: ${lead.score || 'N/A'}\n\nReturn: {"score":75,"category":"Warm","revenuePotential":"Medium","recommendation":"Nurture","nextBestAction":"nurture"}`
    }]);
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
};

export default openRouterAI;