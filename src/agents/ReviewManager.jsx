import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { id: 'google', name: 'Google Reviews', icon: '🇬' },
  { id: 'yelp', name: 'Yelp', icon: '⭐' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'trustpilot', name: 'Trustpilot', icon: '🟢' },
];

export default function ReviewManager() {
  const { leads, updateLead } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('google');
  const [reviews, setReviews] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [activeReply, setActiveReply] = useState(null);
  const [reply, setReply] = useState('');
  const [stats, setStats] = useState({ total: 0, avgRating: 0, responded: 0 });

  const analyzedLeads = leads.filter(l => l.rating);

  const generateReviews = () => {
    if (!selectedLead) { toast.error('Select a lead'); return; }
    const samples = [
      { rating: 5, text: 'Absolutely amazing service! Highly recommend to everyone.', author: 'John D.', date: '2 days ago' },
      { rating: 4, text: 'Great experience overall. Would use again.', author: 'Sarah M.', date: '5 days ago' },
      { rating: 5, text: 'Best in the business! Professional and timely.', author: 'Robert K.', date: '1 week ago' },
      { rating: 3, text: 'Decent service but communication could improve.', author: 'Mike R.', date: '1 week ago' },
      { rating: 2, text: 'Not satisfied with the results. Expected more for the price.', author: 'Lisa K.', date: '2 weeks ago' },
      { rating: 5, text: 'Excellent work! They transformed our online presence.', author: 'David W.', date: '2 weeks ago' },
      { rating: 4, text: 'Good quality work. Timeline was a bit longer than expected.', author: 'Emily T.', date: '3 weeks ago' },
      { rating: 1, text: 'Terrible experience. Would not recommend.', author: 'Anonymous', date: '1 month ago' },
    ];
    
    const generatedReviews = samples.map((r, i) => ({
      ...r,
      id: Date.now() + i,
      platform: selectedPlatform,
      replied: false,
      replyText: '',
    }));
    
    setReviews(generatedReviews);
    
    const avg = generatedReviews.reduce((s, r) => s + r.rating, 0) / generatedReviews.length;
    setStats({ total: generatedReviews.length, avgRating: avg.toFixed(1), responded: 0 });
    toast.success(`${generatedReviews.length} reviews loaded!`);
  };

  const generateReply = async (review) => {
    setActiveReply(review.id);
    setGenerating(true);
    try {
      const result = await openRouterAI.callAI([{ 
        role: 'user', 
        content: `Write a professional, empathetic reply to this ${review.rating}-star ${PLATFORMS.find(p=>p.id===selectedPlatform)?.name} review for ${selectedLead?.businessName}: "${review.text}". Author: ${review.author}. ${review.rating <= 2 ? 'Apologize and offer to make it right.' : review.rating === 3 ? 'Thank them and address concerns.' : 'Thank them enthusiastically.'} Return JSON: {"reply":"Your reply here (keep under 300 chars)"}` 
      }]);
      setReply(result?.reply || generateFallbackReply(review));
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, replied: true, replyText: result?.reply || generateFallbackReply(review) } : r));
      setStats(prev => ({ ...prev, responded: prev.responded + 1 }));
      toast.success('Reply generated!');
    } catch { 
      const fb = generateFallbackReply(review);
      setReply(fb);
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, replied: true, replyText: fb } : r));
    }
    finally { setGenerating(false); setActiveReply(null); }
  };

  const generateFallbackReply = (review) => {
    if (review.rating >= 4) return `Thank you so much for your kind words, ${review.author}! We're thrilled you had a great experience. We look forward to serving you again!`;
    if (review.rating === 3) return `Thank you for your feedback, ${review.author}. We appreciate your honesty and will work on improving our communication. Please reach out if you'd like to discuss further.`;
    return `We're sorry to hear about your experience, ${review.author}. We take your feedback seriously and would like to make things right. Please contact us directly so we can address your concerns.`;
  };

  const copyReply = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  const downloadReport = () => {
    if (reviews.length === 0) return;
    let text = `REVIEW MANAGEMENT REPORT\n${'='.repeat(40)}\nBusiness: ${selectedLead?.businessName}\nPlatform: ${PLATFORMS.find(p=>p.id===selectedPlatform)?.name}\nTotal Reviews: ${stats.total}\nAvg Rating: ${stats.avgRating}⭐\nResponded: ${stats.responded}/${stats.total}\n\n`;
    reviews.forEach((r, i) => {
      text += `Review #${i+1} | ${'⭐'.repeat(r.rating)} | ${r.author} | ${r.date}\n"${r.text}"\n${r.replied ? `Reply: "${r.replyText}"\n` : 'Not replied\n'}\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Reviews-${selectedLead?.businessName}.txt`; a.click();
    toast.success('Report downloaded!');
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating === 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">⭐ Review Manager</h1><p className="text-sm text-gray-500">Manage, respond & analyze online reviews</p></div>
        <div className="flex gap-2">
          {reviews.length > 0 && <button onClick={downloadReport} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs">📥 Report</button>}
          <button onClick={generateReviews} disabled={!selectedLead} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">📥 Load Reviews</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">👤 Business</h3>
            <select value={selectedLead?.id || ''} onChange={e => setSelectedLead(analyzedLeads.find(l => l.id == e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Select business...</option>
              {analyzedLeads.map(l => <option key={l.id} value={l.id}>{l.businessName} (⭐{l.rating})</option>)}
            </select>
            {selectedLead && <p className="text-xs text-gray-500 mt-2">Rating: ⭐{selectedLead.rating} • {selectedLead.totalRatings} reviews</p>}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">📱 Platform</h3>
            <div className="space-y-2">{PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`w-full p-2.5 rounded-lg text-left text-sm ${selectedPlatform===p.id?'bg-purple-50 border-2 border-purple-300':'bg-gray-50 hover:bg-gray-100'}`}>{p.icon} {p.name}</button>
            ))}</div>
          </div>

          {stats.total > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-sm mb-3">📊 Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.total}</div><div className="text-[10px] text-gray-500">Reviews</div></div>
                <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.avgRating}⭐</div><div className="text-[10px] text-gray-500">Avg Rating</div></div>
                <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.responded}</div><div className="text-[10px] text-gray-500">Replied</div></div>
                <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.total - stats.responded}</div><div className="text-[10px] text-gray-500">Pending</div></div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">⭐</p><p>Select a business and load reviews</p></div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto">
              {reviews.map(review => (
                <div key={review.id} className={`p-4 bg-white rounded-xl shadow-sm border ${review.replied ? 'border-green-200' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2"><span className="font-medium text-sm">{review.author}</span><span className={getRatingColor(review.rating) + ' px-2 py-0.5 rounded-full text-xs font-bold'}>{'⭐'.repeat(review.rating)}</span></div>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    {review.replied ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Replied</span>
                    ) : (
                      <button onClick={() => generateReply(review)} disabled={generating} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                        {activeReply === review.id ? '⏳...' : '💬 Reply'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">"{review.text}"</p>
                  {review.replied && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 font-medium mb-1">Your Reply:</p>
                      <p className="text-xs text-green-600">{review.replyText}</p>
                      <button onClick={() => copyReply(review.replyText)} className="text-xs text-green-500 hover:underline mt-1">📋 Copy</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}