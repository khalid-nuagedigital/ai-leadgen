import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const plans = [
  { id: 'free', name: 'Free', price: 0, period: 'forever', icon: '🚀', description: 'Perfect for getting started', features: ['100 leads/month', '500 emails/month', '10 meetings/month', 'Basic AI analysis', 'Email support', '1 user'], cta: 'Get Started Free', popular: false },
  { id: 'starter', name: 'Starter', price: 49, period: 'month', icon: '⭐', description: 'For growing businesses', features: ['500 leads/month', '2,000 emails/month', '50 meetings/month', 'All 7 AI agents', 'Priority support', '3 users', 'API access'], cta: 'Start Free Trial', popular: false },
  { id: 'pro', name: 'Professional', price: 99, period: 'month', icon: '💎', description: 'For serious lead generation', features: ['2,000 leads/month', '10,000 emails/month', '200 meetings/month', 'Advanced AI (GPT-4)', 'Phone support', '10 users', 'CRM integrations'], cta: 'Start Free Trial', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 299, period: 'month', icon: '🏢', description: 'For large teams', features: ['Unlimited leads', '50,000 emails/month', '1,000 meetings/month', 'Custom AI', 'Dedicated manager', 'Unlimited users'], cta: 'Contact Sales', popular: false },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, processPayment, isLoading } = useAuthStore();
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
      if (isAuthenticated) {
        useAuthStore.getState().updatePlan('free');
        toast.success('Free plan activated!');
        navigate('/');
      } else {
        navigate('/register');
      }
      return;
    }
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
    setPaymentStep('details');
    setPaymentResult(null);
  };

  const handlePayment = async () => {
    if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
      toast.error('Please fill in all card details');
      return;
    }

    setPaymentStep('processing');

    const result = await processPayment(selectedPlan.id, {
      ...cardDetails,
      billingCycle,
    });

    if (result.success) {
      setPaymentStep('success');
      setPaymentResult(result.payment);
      toast.success(`🎉 ${selectedPlan.name} plan activated!`);
      setTimeout(() => {
        setShowPayment(false);
        navigate('/');
      }, 2000);
    } else {
      setPaymentStep('failed');
      toast.error(result.error || 'Payment failed');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
    return parts.join(' ').substring(0, 19);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">AI</span></div>
            <span className="text-xl font-bold">LeadGen AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/" className="px-4 py-2 text-gray-700 font-medium">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-gray-700 font-medium">Sign In</Link>
                <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your business</p>
          <div className="inline-flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border">
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium ${billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Monthly</button>
            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-lg text-sm font-medium ${billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Yearly <span className="text-green-400 ml-1">Save 20%</span></button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border-2 p-6 relative ${plan.popular ? 'border-purple-500 shadow-xl scale-105' : 'border-gray-200'}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full">MOST POPULAR</div>}
              <div className="text-center mb-6">
                <span className="text-3xl mb-3 block">{plan.icon}</span>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">${getPrice(plan)}</span>
                <span className="text-gray-500">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm"><span className="text-green-500">✅</span><span className="text-gray-700">{f}</span></li>))}
              </ul>
              <button onClick={() => handleSelectPlan(plan)} className={`w-full py-3 rounded-xl font-semibold ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : plan.id === 'free' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {paymentStep === 'details' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Complete Payment</h3>
                  <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between mb-2"><span>{selectedPlan.name} Plan</span><span className="font-bold">${getPrice(selectedPlan)}/{billingCycle === 'yearly' ? 'year' : 'month'}</span></div>
                  <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg"><span>Total</span><span>${billingCycle === 'yearly' ? Math.round(selectedPlan.price * 0.8 * 12) : selectedPlan.price}</span></div>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label><input type="text" value={cardDetails.cardNumber} onChange={e => setCardDetails({...cardDetails, cardNumber: formatCardNumber(e.target.value)})} maxLength="19" placeholder="4242 4242 4242 4242" className="w-full px-4 py-3 border rounded-xl" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label><input type="text" value={cardDetails.cardName} onChange={e => setCardDetails({...cardDetails, cardName: e.target.value})} placeholder="John Smith" className="w-full px-4 py-3 border rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label><input type="text" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} maxLength="5" placeholder="MM/YY" className="w-full px-4 py-3 border rounded-xl" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">CVV</label><input type="text" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} maxLength="4" placeholder="123" className="w-full px-4 py-3 border rounded-xl" /></div>
                  </div>
                  <button onClick={handlePayment} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg">Pay ${billingCycle === 'yearly' ? Math.round(selectedPlan.price * 0.8 * 12) : selectedPlan.price}</button>
                </div>
              </>
            )}
            {paymentStep === 'processing' && (
              <div className="text-center py-12">
                <div className="animate-spin text-5xl mb-4">⏳</div>
                <h3 className="text-xl font-bold text-gray-700">Processing Payment...</h3>
                <p className="text-gray-500 mt-2">Please wait while we process your payment</p>
              </div>
            )}
            {paymentStep === 'success' && paymentResult && (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
                <div className="bg-green-50 rounded-xl p-4 mt-4 text-left">
                  <p className="text-sm"><strong>Plan:</strong> {paymentResult.planName}</p>
                  <p className="text-sm"><strong>Amount:</strong> ${paymentResult.amount}</p>
                  <p className="text-sm"><strong>Card:</strong> {paymentResult.cardBrand} ****{paymentResult.cardLast4}</p>
                  <p className="text-sm"><strong>Transaction:</strong> {paymentResult.transactionId}</p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(paymentResult.paidAt).toLocaleString()}</p>
                </div>
                <p className="text-gray-500 mt-4">Redirecting to dashboard...</p>
              </div>
            )}
            {paymentStep === 'failed' && (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-red-700">Payment Failed</h3>
                <p className="text-gray-500 mt-2">Please try again or use a different card</p>
                <button onClick={() => setPaymentStep('details')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl">Try Again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}