import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Register new user
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Validate email uniqueness (simulated)
          const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
          if (existingUsers.find(u => u.email === userData.email)) {
            throw new Error('Email already registered');
          }

          const newUser = {
            id: Date.now().toString(),
            ...userData,
            plan: 'free',
            createdAt: new Date().toISOString(),
            billingInfo: null,
            usageStats: {
              leadsThisMonth: 0,
              emailsSent: 0,
              meetingsBooked: 0,
              maxLeads: 100,
              maxEmails: 500,
              maxMeetings: 10,
            },
          };

          // Save to localStorage (simulated DB)
          existingUsers.push(newUser);
          localStorage.setItem('users', JSON.stringify(existingUsers));

          set({ 
            user: newUser, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });

          return { success: true, user: newUser };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          
          if (!user) {
            throw new Error('Invalid email or password');
          }

          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });

          return { success: true, user };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Logout
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      // Update user profile
      updateProfile: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates }
        }));
        
        // Update in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === get().user?.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...updates };
          localStorage.setItem('users', JSON.stringify(users));
        }
      },

      // Update user plan
      updatePlan: (planId, billingInfo) => {
        const plans = {
          starter: {
            maxLeads: 500,
            maxEmails: 2000,
            maxMeetings: 50,
            price: 49,
          },
          pro: {
            maxLeads: 2000,
            maxEmails: 10000,
            maxMeetings: 200,
            price: 99,
          },
          enterprise: {
            maxLeads: 10000,
            maxEmails: 50000,
            maxMeetings: 1000,
            price: 299,
          },
        };

        const plan = plans[planId];
        if (!plan) return false;

        set((state) => ({
          user: {
            ...state.user,
            plan: planId,
            billingInfo: billingInfo || state.user?.billingInfo,
            usageStats: {
              ...state.user?.usageStats,
              maxLeads: plan.maxLeads,
              maxEmails: plan.maxEmails,
              maxMeetings: plan.maxMeetings,
            },
          },
        }));

        // Update in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === get().user?.id);
        if (index !== -1) {
          users[index] = { ...users[index], plan: planId, billingInfo };
          localStorage.setItem('users', JSON.stringify(users));
        }

        return true;
      },

      // Update billing info
      updateBillingInfo: (billingInfo) => {
        set((state) => ({
          user: { ...state.user, billingInfo }
        }));
      },

      // Check if user can perform action
      canPerformAction: (action) => {
        const user = get().user;
        if (!user) return false;

        const { usageStats } = user;
        
        switch (action) {
          case 'find_leads':
            return usageStats.leadsThisMonth < usageStats.maxLeads;
          case 'send_email':
            return usageStats.emailsSent < usageStats.maxEmails;
          case 'book_meeting':
            return usageStats.meetingsBooked < usageStats.maxMeetings;
          default:
            return true;
        }
      },

      // Increment usage
      incrementUsage: (action) => {
        set((state) => {
          if (!state.user) return state;
          
          const newStats = { ...state.user.usageStats };
          
          switch (action) {
            case 'find_leads':
              newStats.leadsThisMonth += 1;
              break;
            case 'send_email':
              newStats.emailsSent += 1;
              break;
            case 'book_meeting':
              newStats.meetingsBooked += 1;
              break;
          }

          return {
            user: { ...state.user, usageStats: newStats }
          };
        });
      },

      // Clear error
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