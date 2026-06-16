import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    icon: '🚀',
    color: 'gray',
    features: [
      '100 leads per month',
      '500 emails per month',
      '10 meetings per month',
      'Basic AI analysis',
      'Email support',
      '1 user',
    ],
    notIncluded: [
      'Advanced AI agents',
      'API access',
      'Custom branding',
      'Priority support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: 'month',
    description: 'For growing businesses',
    icon: '⭐',
    color: 'blue',
    features: [
      '500 leads per month',
      '2,000 emails per month',
      '50 meetings per month',
      'All 7 AI agents',
      'Priority email support',
      '3 users',
      'Basic API access',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    period: 'month',
    description: 'For serious lead generation',
    icon: '💎',
    color: 'purple',
    features: [
      '2,000 leads per month',
      '10,000 emails per month',
      '200 meetings per month',
      'Advanced AI with GPT-4',
      'Priority phone & email support',
      '10 users',
      'Full API access',
      'White-label reports',
      'CRM integrations',
      'A/B testing',
    ],
    cta: 'Start Free Trial',
    popular: true,
    savings: 'Save 20% annually',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    period: 'month',
    description: 'For large teams and agencies',
    icon: '🏢',
    color: 'indigo',
    features: [
      'Unlimited leads',
      '50,000 emails per month',
      '1,000 meetings per month',
      'Custom AI model training',
      'Dedicated account manager',
      'Unlimited users',
      'Advanced API access',
      'SLA guarantee',
      'Custom integrations',
      'On-premise option',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, updatePlan, isAuthenticated } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [processing, setProcessing] = useState(false);

  const getPrice = (plan) => {
    if (plan.price === 0) return 0;
    return billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === 'free') {
      if (isAuthenticated) {
        updatePlan('free');
        toast.success('Free plan activated!');
        navigate('/');
      } else {
        navigate('/register');
      }
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePayment = async () => {
    if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
      toast.error('Please fill in all card details');
      return;
    }

    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (isAuthenticated && selectedPlan) {
      updatePlan(selectedPlan.id, {
        last4: cardDetails.cardNumber.slice(-4),
        brand: 'Visa',
        expiry: cardDetails.expiry,
      });
      
      setProcessing(false);
      setShowPayment(false);
      toast.success(`🎉 ${selectedPlan.name} plan activated!`);
      navigate('/');
    } else {
      setProcessing(false);
      navigate('/register');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <span className="text-xl font-bold">LeadGen AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/" className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">Sign In</Link>
                <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your business needs</p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Yearly <span className="text-green-400 ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm border-2 p-6 relative ${
                plan.popular ? 'border-purple-500 shadow-xl scale-105' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-6">
                <span className="text-3xl mb-3 block">{plan.icon}</span>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">${getPrice(plan)}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-green-600 mt-1">${plan.price * 12} billed annually</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✅</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-300 mt-0.5">❌</span>
                    <span className="text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl'
                    : plan.id === 'free'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Compare All Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Feature</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">Free</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">Starter</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">Pro</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'AI Lead Finder', free: '✅', starter: '✅', pro: '✅', enterprise: '✅' },
                  { feature: 'Website Analyzer', free: 'Basic', starter: '✅', pro: '✅', enterprise: '✅' },
                  { feature: 'Offer Generator', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
                  { feature: 'Outreach Agent', free: '100/mo', starter: '500/mo', pro: '2000/mo', enterprise: 'Unlimited' },
                  { feature: 'Follow-up Sequences', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
                  { feature: 'AI Qualification', free: '❌', starter: 'Basic', pro: 'Advanced', enterprise: 'Custom AI' },
                  { feature: 'Meeting Scheduler', free: '10/mo', starter: '50/mo', pro: '200/mo', enterprise: '1000/mo' },
                  { feature: 'API Access', free: '❌', starter: 'Basic', pro: 'Full', enterprise: 'Advanced' },
                  { feature: 'CRM Integration', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
                  { feature: 'Custom Branding', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
                  { feature: 'Priority Support', free: '❌', starter: 'Email', pro: 'Phone & Email', enterprise: '24/7 Dedicated' },
                ].map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-sm">{row.free}</td>
                    <td className="py-3 px-4 text-center text-sm">{row.starter}</td>
                    <td className="py-3 px-4 text-center text-sm font-medium text-purple-600">{row.pro}</td>
                    <td className="py-3 px-4 text-center text-sm">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Complete Payment</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{selectedPlan.name} Plan</span>
                <span className="font-bold">${getPrice(selectedPlan)}/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Annual discount (20%)</span>
                  <span>-${Math.round(selectedPlan.price * 0.2 * 12)}</span>
                </div>
              )}
              <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${billingCycle === 'yearly' ? Math.round(selectedPlan.price * 0.8 * 12) : selectedPlan.price}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })}
                  maxLength="19"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  value={cardDetails.cardName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    maxLength="5"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    maxLength="4"
                    placeholder="123"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>🔒</span>
                <span>Your payment info is secure and encrypted</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-lg"
              >
                {processing ? 'Processing...' : `Pay $${billingCycle === 'yearly' ? Math.round(selectedPlan.price * 0.8 * 12) : selectedPlan.price}`}
              </button>

              <p className="text-xs text-center text-gray-400">
                By completing payment, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}