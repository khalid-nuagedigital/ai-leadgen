import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      payments: [],

      // ============ AUTH ============

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(r => setTimeout(r, 1000));
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          if (users.find(u => u.email === userData.email)) throw new Error('Email already registered');
          
          const newUser = {
            id: Date.now().toString(),
            ...userData,
            plan: 'free',
            createdAt: new Date().toISOString(),
            billingInfo: null,
            paymentHistory: [],
            usageStats: { leadsThisMonth: 0, emailsSent: 0, meetingsBooked: 0, maxLeads: 100, maxEmails: 500, maxMeetings: 10 },
          };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          set({ user: newUser, isAuthenticated: true, isLoading: false });
          return { success: true, user: newUser };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(r => setTimeout(r, 800));
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          if (!user) throw new Error('Invalid email or password');
          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true, user };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      logout: () => set({ user: null, isAuthenticated: false, error: null }),

      // ============ PAYMENT ============

      processPayment: async (planId, cardDetails) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(r => setTimeout(r, 2000));
          
          const plans = {
            starter: { maxLeads: 500, maxEmails: 2000, maxMeetings: 50, price: 49 },
            pro: { maxLeads: 2000, maxEmails: 10000, maxMeetings: 200, price: 99 },
            enterprise: { maxLeads: 10000, maxEmails: 50000, maxMeetings: 1000, price: 299 },
          };
          
          const plan = plans[planId];
          if (!plan) throw new Error('Invalid plan');

          const cardBrand = (cardDetails.cardNumber || '').startsWith('4') ? 'Visa' : 
                           (cardDetails.cardNumber || '').startsWith('5') ? 'Mastercard' : 'Card';

          const payment = {
            id: `pay_${Date.now()}`,
            planId,
            planName: planId.charAt(0).toUpperCase() + planId.slice(1),
            amount: plan.price,
            cardLast4: (cardDetails.cardNumber || '').slice(-4) || '****',
            cardBrand,
            status: 'completed',
            billingCycle: cardDetails.billingCycle || 'monthly',
            paidAt: new Date().toISOString(),
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          };

          const billingInfo = {
            last4: (cardDetails.cardNumber || '').slice(-4),
            brand: cardBrand,
            expiry: cardDetails.expiry,
            name: cardDetails.cardName,
          };

          set((state) => ({
            user: {
              ...state.user,
              plan: planId,
              billingInfo,
              paymentHistory: [...(state.user?.paymentHistory || []), payment],
              usageStats: {
                ...state.user?.usageStats,
                maxLeads: plan.maxLeads,
                maxEmails: plan.maxEmails,
                maxMeetings: plan.maxMeetings,
              },
            },
            isLoading: false,
          }));

          // Sync to localStorage
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const idx = users.findIndex(u => u.id === get().user?.id);
          if (idx !== -1) {
            users[idx] = {
              ...users[idx],
              plan: planId,
              billingInfo,
              paymentHistory: [...(users[idx].paymentHistory || []), payment],
              usageStats: { ...users[idx].usageStats, maxLeads: plan.maxLeads, maxEmails: plan.maxEmails, maxMeetings: plan.maxMeetings },
            };
            localStorage.setItem('users', JSON.stringify(users));
          }

          return { success: true, payment };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      // ============ PLAN ============

      updatePlan: (planId, billingInfo) => {
        const plans = {
          starter: { maxLeads: 500, maxEmails: 2000, maxMeetings: 50, price: 49 },
          pro: { maxLeads: 2000, maxEmails: 10000, maxMeetings: 200, price: 99 },
          enterprise: { maxLeads: 10000, maxEmails: 50000, maxMeetings: 1000, price: 299 },
        };
        const plan = plans[planId] || { maxLeads: 100, maxEmails: 500, maxMeetings: 10 };

        set((state) => ({
          user: {
            ...state.user,
            plan: planId,
            billingInfo: billingInfo || state.user?.billingInfo,
            usageStats: { ...state.user?.usageStats, ...plan },
          },
        }));

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.id === get().user?.id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], plan: planId, billingInfo };
          localStorage.setItem('users', JSON.stringify(users));
        }
        return true;
      },

      updateBillingInfo: (billingInfo) => set((state) => ({ user: { ...state.user, billingInfo } })),
      
      getPaymentHistory: () => get().user?.paymentHistory || [],

      // ============ PROFILE ============

      updateProfile: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.id === get().user?.id);
        if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; localStorage.setItem('users', JSON.stringify(users)); }
      },

      // ============ USAGE ============

      canPerformAction: (action) => {
        const { user } = get();
        if (!user) return false;
        const { usageStats } = user;
        switch (action) {
          case 'find_leads': return usageStats.leadsThisMonth < usageStats.maxLeads;
          case 'send_email': return usageStats.emailsSent < usageStats.maxEmails;
          case 'book_meeting': return usageStats.meetingsBooked < usageStats.maxMeetings;
          default: return true;
        }
      },

      incrementUsage: (action) => {
        set((state) => {
          if (!state.user) return state;
          const stats = { ...state.user.usageStats };
          if (action === 'find_leads') stats.leadsThisMonth += 1;
          if (action === 'send_email') stats.emailsSent += 1;
          if (action === 'book_meeting') stats.meetingsBooked += 1;
          return { user: { ...state.user, usageStats: stats } };
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;