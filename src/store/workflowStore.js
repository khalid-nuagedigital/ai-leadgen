import { create } from 'zustand';

export const useWorkflowStore = create((set) => ({
  workflows: [
    {
      id: 'marketing',
      name: 'Marketing Funnel',
      type: 'marketing',
      active: true,
      targets: ['Dentists', 'Lawyers', 'Realtors', 'Restaurants'],
      services: ['SEO', 'Google Ads', 'Meta Ads', 'Web Development'],
    },
    {
      id: 'accounting',
      name: 'Accounting Funnel',
      type: 'accounting',
      active: false,
      targets: ['Construction', 'Medical', 'E-commerce'],
      services: ['Bookkeeping', 'Payroll', 'Tax Filing'],
    },
  ],
  activeWorkflow: 'marketing',

  toggleWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, active: !w.active } : w)),
    })),

  setActiveWorkflow: (id) => set({ activeWorkflow: id }),
}));
