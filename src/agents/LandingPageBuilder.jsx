import React, { useState } from 'react';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function LandingPageBuilder() {
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('leads');
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!business) { toast.error('Enter business name'); return; }
    setGenerating(true);
    try {
      const result = await openRouterAI.callAI([{ role: 'user', content: `Create a landing page for ${business} (${industry}). Goal: ${goal}. Return JSON: {"headline":"Main headline","subheadline":"Sub headline","cta":"Call to action","sections":[{"title":"Section title","content":"Content"}],"trustElements":["Testimonial","Guarantee"],"metaTitle":"SEO title","metaDescription":"SEO description"}` }]);
      setGenerated(result?.headline ? result : { headline: `Transform Your ${industry||'Business'} Today`, subheadline: 'Get more leads, sales, and growth', cta: 'Get Started Free', sections: [{title:'Why Choose Us',content:'We deliver results'}], trustElements: ['5-Star Rated','Money Back Guarantee'], metaTitle: `${business} - ${industry} Services`, metaDescription: `Top ${industry} services by ${business}` });
      toast.success('Landing page generated!');
    } catch { toast.error('Generation failed'); }
    finally { setGenerating(false); }
  };

  const downloadHTML = () => {
    if (!generated) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${generated.metaTitle}</title><meta name="description" content="${generated.metaDescription}"><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px}.hero{text-align:center;padding:60px 20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:20px}.hero h1{font-size:36px}.cta-btn{display:inline-block;padding:15px 40px;background:#fff;color:#764ba2;border-radius:50px;text-decoration:none;font-weight:bold;margin-top:20px}.section{padding:40px 0;border-bottom:1px solid #eee}</style></head><body><div class="hero"><h1>${generated.headline}</h1><p>${generated.subheadline}</p><a href="#" class="cta-btn">${generated.cta}</a></div>${generated.sections?.map(s=>`<div class="section"><h2>${s.title}</h2><p>${s.content}</p></div>`).join('')}<div style="text-align:center;padding:40px"><p>${generated.trustElements?.join(' | ')}</p></div></body></html>`;
    const blob = new Blob([html],{type:'text/html'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='landing-page.html'; a.click(); toast.success('Downloaded!');
  };

  const copyHTML = () => { if(generated) { const html = `<!-- Landing Page for ${business} -->`; navigator.clipboard.writeText(html); toast.success('Template copied!'); } };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">🌐 Landing Page Builder</h1><p className="text-sm text-gray-500">AI-generated landing pages</p></div>
        <button onClick={generate} disabled={generating||!business} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{generating?'⏳':'✨ Generate'}</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div><label className="text-xs">Business Name</label><input value={business} onChange={e=>setBusiness(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs">Industry</label><input value={industry} onChange={e=>setIndustry(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs">Goal</label><select value={goal} onChange={e=>setGoal(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1"><option value="leads">Lead Generation</option><option value="sales">Sales</option><option value="signups">Signups</option><option value="calls">Phone Calls</option></select></div>
          </div>
        </div>
        <div className="lg:col-span-2">
          {generated ? (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 text-center"><h2 className="text-3xl font-bold">{generated.headline}</h2><p className="text-purple-100 mt-2">{generated.subheadline}</p><button className="mt-4 px-8 py-3 bg-white text-purple-700 rounded-full font-bold">{generated.cta}</button></div>
              <div className="p-6 space-y-4">{generated.sections?.map((s,i)=><div key={i} className="p-4 bg-gray-50 rounded-lg"><h3 className="font-semibold">{s.title}</h3><p className="text-sm text-gray-600 mt-1">{s.content}</p></div>)}</div>
              <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-600">{generated.trustElements?.join(' • ')}</div>
              <div className="p-4 border-t flex gap-2"><button onClick={downloadHTML} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">📥 Download HTML</button><button onClick={copyHTML} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs">📋 Copy</button></div>
            </div>
          ) : <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">🌐</p><p>Enter business details to generate</p></div>}
        </div>
      </div>
    </div>
  );
}