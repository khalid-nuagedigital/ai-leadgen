/**
 * Local Email Service
 * Works on localhost without external APIs
 * Stores emails in localStorage and simulates sending
 */

const EMAIL_STORAGE_KEY = 'local_emails';
const EMAIL_TEMPLATES_KEY = 'local_email_templates';

// Initialize localStorage
const getEmails = () => JSON.parse(localStorage.getItem(EMAIL_STORAGE_KEY) || '[]');
const saveEmails = (emails) => localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
const getTemplates = () => JSON.parse(localStorage.getItem(EMAIL_TEMPLATES_KEY) || '[]');
const saveTemplates = (templates) => localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(templates));

// Default templates
const defaultTemplates = [
  {
    id: 'initial-outreach',
    name: 'Initial Outreach',
    category: 'marketing',
    subject: 'Growth opportunity for {{businessName}}',
    body: `Hi {{contactName}},

I noticed {{businessName}} is a {{industry}} in {{city}}. We specialize in helping {{industry}} businesses grow through digital marketing.

Our key services:
• SEO Optimization
• Google Ads Management
• Social Media Marketing
• Website Development

Would you be open to a quick 15-minute call to discuss?

Best regards,
Nuage Digital Team`,
  },
  {
    id: 'follow-up',
    name: 'Follow-up Email',
    category: 'marketing',
    subject: 'Following up - {{businessName}}',
    body: `Hi {{contactName}},

Just following up on my previous email. I understand you're busy, but I believe we can add significant value to {{businessName}}.

Let me know if you'd like to chat.

Best,
Nuage Digital Team`,
  },
  {
    id: 'case-study',
    name: 'Case Study Sharing',
    category: 'marketing',
    subject: 'How we helped a {{industry}} business grow',
    body: `Hi {{contactName}},

I wanted to share a quick case study. We recently helped a {{industry}} business increase their leads by 150% in 3 months.

I see similar potential for {{businessName}}. Would you be interested in learning how?

Best,
Nuage Digital Team`,
  },
  {
    id: 'accounting-initial',
    name: 'Accounting Outreach',
    category: 'accounting',
    subject: 'Streamline {{businessName}}\'s finances',
    body: `Hi {{contactName}},

Managing finances for a {{industry}} in {{city}} can be challenging. We help businesses like {{businessName}} with:

• Bookkeeping & Payroll
• Tax Preparation & Filing
• CFO Advisory Services
• Financial Planning

Would you be open to a consultation call?

Best regards,
Nuage Digital Team`,
  },
];

// Initialize default templates if none exist
if (getTemplates().length === 0) {
  saveTemplates(defaultTemplates);
}

export const emailService = {
  // ========== SEND EMAIL ==========
  
  /**
   * Send a single email (stored locally)
   */
  sendEmail: async ({ to, toName, subject, body, from = 'outreach@nuagedigital.com', fromName = 'Nuage Digital Team', templateId }) => {
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const email = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      to,
      toName,
      from,
      fromName,
      subject,
      body,
      templateId,
      status: 'sent',
      sentAt: new Date().toISOString(),
      opened: false,
      openedAt: null,
      replied: false,
      replyText: null,
      repliedAt: null,
    };
    
    const emails = getEmails();
    emails.unshift(email);
    saveEmails(emails);
    
    console.log('📧 Email Sent (Local):', { to, subject });
    return email;
  },

  /**
   * Send bulk emails
   */
  sendBulkEmails: async (recipients, template) => {
    const results = { sent: 0, failed: 0, total: recipients.length };
    
    for (const recipient of recipients) {
      try {
        const personalizedSubject = personalizeTemplate(template.subject, recipient);
        const personalizedBody = personalizeTemplate(template.body, recipient);
        
        await emailService.sendEmail({
          to: recipient.email,
          toName: recipient.contactName || recipient.businessName,
          subject: personalizedSubject,
          body: personalizedBody,
          templateId: template.id,
        });
        results.sent++;
      } catch (e) {
        results.failed++;
      }
      // Delay between emails
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  },

  // ========== GET EMAILS ==========
  
  /**
   * Get all sent emails
   */
  getSentEmails: () => {
    return getEmails().filter(e => e.status === 'sent');
  },

  /**
   * Get email by ID
   */
  getEmailById: (id) => {
    return getEmails().find(e => e.id === id);
  },

  /**
   * Get emails sent to a specific lead
   */
  getEmailsForLead: (leadEmail) => {
    return getEmails().filter(e => e.to === leadEmail);
  },

  // ========== SIMULATE REPLY ==========
  
  /**
   * Simulate a lead replying to an email
   */
  simulateReply: async (emailId, replyText) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const emails = getEmails();
    const emailIndex = emails.findIndex(e => e.id === emailId);
    
    if (emailIndex !== -1) {
      emails[emailIndex].replied = true;
      emails[emailIndex].replyText = replyText;
      emails[emailIndex].repliedAt = new Date().toISOString();
      emails[emailIndex].status = 'replied';
      saveEmails(emails);
    }
    
    return emails[emailIndex];
  },

  /**
   * Simulate email open
   */
  simulateOpen: async (emailId) => {
    const emails = getEmails();
    const emailIndex = emails.findIndex(e => e.id === emailId);
    
    if (emailIndex !== -1 && !emails[emailIndex].opened) {
      emails[emailIndex].opened = true;
      emails[emailIndex].openedAt = new Date().toISOString();
      saveEmails(emails);
    }
    
    return emails[emailIndex];
  },

  // ========== AUTO-REPLY CONFIGURATION ==========
  
  /**
   * Configure auto-reply rules
   */
  autoReplyRules: [
    {
      id: 'interested',
      keywords: ['interested', 'tell me more', 'yes', 'schedule', 'call', 'meeting', 'learn more'],
      reply: `Thank you for your interest! I'd love to schedule a call to discuss how we can help.

Are you available this week? You can book a time directly here: https://nuage-digital.com/book-appointment/

Looking forward to connecting!`,
    },
    {
      id: 'not-interested',
      keywords: ['not interested', 'no thanks', 'stop', 'unsubscribe', 'remove'],
      reply: `I understand completely. I'll remove you from our outreach list.

If you ever need digital marketing services in the future, feel free to reach out.

Best wishes!`,
    },
    {
      id: 'pricing',
      keywords: ['price', 'cost', 'how much', 'pricing', 'budget', 'package'],
      reply: `Great question about pricing! Our packages are customized based on your needs.

Here's a quick overview:
• Starter Package: $1,500-3,000/month
• Professional Package: $3,000-7,000/month
• Enterprise: Custom pricing

Would you like me to put together a custom proposal for {{businessName}}?`,
    },
    {
      id: 'more-info',
      keywords: ['more information', 'details', 'services', 'what do you offer'],
      reply: `We offer a comprehensive range of digital marketing services:

• SEO Optimization
• Google Ads Management
• Social Media Marketing
• Website Development
• Content Marketing
• Email Marketing

Which of these are you most interested in? I can send you detailed case studies.`,
    },
  ],

  /**
   * Get auto-reply based on message content
   */
  getAutoReply: (messageText) => {
    const lowerMsg = messageText.toLowerCase();
    
    for (const rule of emailService.autoReplyRules) {
      if (rule.keywords.some(keyword => lowerMsg.includes(keyword))) {
        return rule.reply;
      }
    }
    
    // Default reply
    return `Thank you for your response! 

I'd love to learn more about your needs and how we can help {{businessName}} grow.

Would you be available for a quick 15-minute call this week?

Best regards,
Nuage Digital Team`;
  },

  // ========== ANALYTICS ==========
  
  /**
   * Get email analytics
   */
  getAnalytics: () => {
    const allEmails = getEmails();
    const sent = allEmails.filter(e => e.status === 'sent').length;
    const opened = allEmails.filter(e => e.opened).length;
    const replied = allEmails.filter(e => e.replied).length;
    
    return {
      totalSent: allEmails.length,
      sent,
      opened,
      replied,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
      replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : 0,
    };
  },

  // ========== TEMPLATES ==========
  
  /**
   * Get all templates
   */
  getTemplates: () => getTemplates(),

  /**
   * Save template
   */
  saveTemplate: (template) => {
    const templates = getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex !== -1) {
      templates[existingIndex] = template;
    } else {
      template.id = template.id || `template_${Date.now()}`;
      templates.push(template);
    }
    
    saveTemplates(templates);
    return template;
  },

  /**
   * Delete template
   */
  deleteTemplate: (id) => {
    const templates = getTemplates().filter(t => t.id !== id);
    saveTemplates(templates);
  },

  // ========== CLEAR ==========
  
  /**
   * Clear all emails
   */
  clearAllEmails: () => {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
  },

  /**
   * Reset templates to default
   */
  resetTemplates: () => {
    saveTemplates(defaultTemplates);
  },
};

/**
 * Personalize template with variables
 */
export function personalizeTemplate(template, data) {
  if (!template || !data) return template;
  
  let personalized = template;
  
  // Replace variables
  const variables = {
    '{{businessName}}': data.businessName || '',
    '{{contactName}}': data.contactName || 'there',
    '{{industry}}': data.industry || '',
    '{{city}}': data.city || 'your area',
    '{{email}}': data.email || '',
    '{{phone}}': data.phone || '',
    '{{score}}': data.score || 'N/A',
    '{{service}}': data.recommendedService || 'Digital Marketing',
  };
  
  Object.entries(variables).forEach(([key, value]) => {
    personalized = personalized.replace(new RegExp(key, 'g'), value);
  });
  
  return personalized;
}

export default emailService;