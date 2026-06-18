import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const plans = [
  { 
    id: 'free', name: 'Free', price: 0, period: 'forever', icon: '🚀', 
    description: 'Perfect for getting started', 
    features: ['100 leads/month', '500 emails/month', '10 meetings/month', '3 Core AI agents', 'Email support', '1 user'],
    notIncluded: ['Advanced agents', 'PDF reports', 'API access', 'Priority support'],
    cta: 'Get Started Free', popular: false, color: 'gray',
    agentCount: '3 Core Agents'
  },
  { 
    id: 'starter', name: 'Starter', price: 49, period: 'month', icon: '⭐', 
    description: 'For growing businesses', 
    features: ['500 leads/month', '2,000 emails/month', '50 meetings/month', '7 Core AI agents', '5 Extended agents', '3 users', 'Email templates', 'Basic reports'],
    cta: 'Start Free Trial', popular: false, color: 'blue',
    agentCount: '12 Agents'
  },
  { 
    id: 'pro', name: 'Professional', price: 99, period: 'month', icon: '💎', 
    description: 'For serious lead generation', 
    features: ['2,000 leads/month', '10,000 emails/month', '200 meetings/month', 'All 23 AI agents', 'PDF reports & proposals', '10 users', 'CRM integrations', 'Voice commands', 'Priority phone support', 'White-label reports'],
    cta: 'Start Free Trial', popular: true, color: 'purple',
    agentCount: 'All 23 Agents',
    badge: 'MOST POPULAR'
  },
  { 
    id: 'enterprise', name: 'Enterprise', price: 299, period: 'month', icon: '🏢', 
    description: 'For large teams & agencies', 
    features: ['Unlimited leads', '50,000 emails/month', '1,000 meetings/month', 'All 23 AI agents', 'Custom AI training', 'Unlimited users', 'Dedicated account manager', 'SLA guarantee', 'On-premise option', 'API access', 'Custom integrations', '24/7 support'],
    cta: 'Contact Sales', popular: false, color: 'indigo',
    agentCount: 'All 23 Agents + Custom'
  },
];

const featureComparison = [
  { feature: 'AI Lead Finder', free: '✅', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Website Analyzer', free: 'Basic', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Offer Generator', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Outreach Agent', free: '100/mo', starter: '500/mo', pro: '2,000/mo', enterprise: 'Unlimited' },
  { feature: 'Follow-up Sequences', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'AI Qualification', free: '❌', starter: '✅', pro: 'Advanced', enterprise: 'Custom AI' },
  { feature: 'Meeting Scheduler', free: '10/mo', starter: '50/mo', pro: '200/mo', enterprise: '1,000/mo' },
  { feature: 'Proposal Builder', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Content Writer', free: '❌', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Competitor Analyzer', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'ROI Calculator', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Social Scheduler', free: '❌', starter: '3 platforms', pro: 'All platforms', enterprise: 'All platforms' },
  { feature: 'Review Manager', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Referral Generator', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Invoice Generator', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Email Templates', free: '5', starter: '20', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Client Onboarding', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'A/B Test Analyzer', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Meeting Notes', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Cold Email Agent', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Landing Page Builder', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Client Portal', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Voice Commands', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'PDF Reports', free: '❌', starter: 'Basic', pro: 'Advanced', enterprise: 'White-label' },
  { feature: 'API Access', free: '❌', starter: 'Basic', pro: 'Full', enterprise: 'Advanced' },
  { feature: 'Support', free: 'Email', starter: 'Priority Email', pro: 'Phone & Email', enterprise: '24/7 Dedicated' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, processPayment } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState('details');
  const [cardDetails, setCardDetails] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [paymentResult, setPaymentResult] = useState(null);

  const getPrice = (plan) => {
    if (plan.price === 0) return 0;
    return billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === 'free') {
      if (isAuthenticated) { useAuthStore.getState().updatePlan('free'); toast.success('Free plan activated!'); navigate('/'); }
      else { navigate('/register'); }
      return;
    }
    if (!isAuthenticated) { navigate('/register'); return; }
    setSelectedPlan(plan);
    setShowPayment(true);
    setPaymentStep('details');
    setPaymentResult(null);
  };

  const handlePayment = async () => {
    if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) { toast.error('Please fill in all card details'); return; }
    setPaymentStep('processing');
    const result = await processPayment(selectedPlan.id, { ...cardDetails, billingCycle });
    if (result.success) {
      setPaymentStep('success'); setPaymentResult(result.payment);
      toast.success(`🎉 ${selectedPlan.name} plan activated!`);
      setTimeout(() => { setShowPayment(false); navigate('/'); }, 2000);
    } else { setPaymentStep('failed'); toast.error(result.error || 'Payment failed'); }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = []; for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
    return parts.join(' ').substring(0, 19);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md"><span className="text-white font-bold">AI</span></div>
            <span className="text-xl font-bold text-gray-900">LeadGen AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/" className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg">Sign In</Link>
                <Link to="/register" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8">Choose the plan that fits your business needs</p>
          <div className="inline-flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border">
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Monthly</button>
            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Yearly <span className="text-green-500 font-semibold">Save 20%</span></button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border-2 p-6 relative flex flex-col ${plan.popular ? 'border-purple-400 shadow-xl scale-[1.02]' : 'border-gray-200'}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">{plan.badge}</div>}
              <div className="text-center mb-5">
                <span className="text-3xl mb-3 block">{plan.icon}</span>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{plan.agentCount}</span>
              </div>
              <div className="text-center mb-5">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">${getPrice(plan)}</span>
                  <span className="text-gray-500 text-sm">/{plan.period}</span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-green-600 mt-1">${plan.price * 12} billed annually</p>
                )}
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm"><span className="text-green-500 mt-0.5">✅</span><span className="text-gray-700">{f}</span></li>))}
                {plan.notIncluded?.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm"><span className="text-gray-300 mt-0.5">❌</span><span className="text-gray-400">{f}</span></li>))}
              </ul>
              <button onClick={() => handleSelectPlan(plan)} className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl' : plan.id === 'free' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}>{plan.cta}</button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Compare All Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Free</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Starter</th>
                  <th className="text-center py-3 px-4 font-semibold text-purple-600">Pro</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-xs">{row.free}</td>
                    <td className="py-3 px-4 text-center text-xs">{row.starter}</td>
                    <td className="py-3 px-4 text-center text-xs font-medium text-purple-700 bg-purple-50">{row.pro}</td>
                    <td className="py-3 px-4 text-center text-xs">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
            {[
              { q: 'Can I change plans later?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
              { q: 'Is there a free trial?', a: 'Starter and Pro plans come with a 14-day free trial. No credit card required.' },
              { q: 'What payment methods?', a: 'We accept all major credit cards: Visa, Mastercard, American Express, and Discover.' },
              { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription at any time with no penalties.' },
            ].map((faq, i) => (
              <div key={i} className="p-5 bg-white rounded-xl border">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            {paymentStep === 'details' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Complete Payment</h3>
                  <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between mb-2"><span className="font-medium">{selectedPlan.name} Plan</span><span className="font-bold">${getPrice(selectedPlan)}/{billingCycle === 'yearly' ? 'year' : 'month'}</span></div>
                  <div className="text-xs text-gray-500 mb-2">{selectedPlan.agentCount}</div>
                  {billingCycle === 'yearly' && <div className="text-sm text-green-600">20% annual discount applied</div>}
                  <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg"><span>Total Due</span><span>${billingCycle === 'yearly' ? Math.round(selectedPlan.price * 0.8 * 12) : selectedPlan.price}</span></div>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label><input type="text" value={cardDetails.cardNumber} onChange={e => setCardDetails({...cardDetails, cardNumber: formatCardNumber(e.target.value)})} maxLength="19" placeholder="4242 4242 4242 4242" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label><input type="text" value={cardDetails.cardName} onChange={e => setCardDetails({...cardDetails, cardName: e.target.value})} placeholder="John Smith" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label><input type="text" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} maxLength="5" placeholder="MM/YY" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">CVV</label><input type="text" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} maxLength="4" placeholder="123" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500" /></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500"><span>🔒</span> Secured by SSL encryption. We never store your full card details.</div>
                  <button onClick={handlePayment} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">Pay ${billingCycle === 'yearly' ? Math.round(selectedPlan.price * 0.8 * 12) : selectedPlan.price}</button>
                </div>
              </>
            )}
            {paymentStep === 'processing' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <h3 className="text-xl font-bold text-gray-700">Processing Payment...</h3>
                <p className="text-gray-500 mt-2">Please wait while we process your payment</p>
              </div>
            )}
            {paymentStep === 'success' && paymentResult && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center text-3xl">✅</div>
                <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
                <div className="bg-green-50 rounded-xl p-4 mt-4 text-left space-y-1">
                  <p className="text-sm"><strong>Plan:</strong> {paymentResult.planName}</p>
                  <p className="text-sm"><strong>Amount:</strong> ${paymentResult.amount}</p>
                  <p className="text-sm"><strong>Card:</strong> {paymentResult.cardBrand} ****{paymentResult.cardLast4}</p>
                  <p className="text-sm"><strong>Transaction ID:</strong> {paymentResult.transactionId}</p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(paymentResult.paidAt).toLocaleString()}</p>
                </div>
                <p className="text-gray-500 mt-4">Redirecting to dashboard...</p>
              </div>
            )}
            {paymentStep === 'failed' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center text-3xl">❌</div>
                <h3 className="text-xl font-bold text-red-700">Payment Failed</h3>
                <p className="text-gray-500 mt-2">Please try again or use a different card</p>
                <button onClick={() => setPaymentStep('details')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Try Again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}