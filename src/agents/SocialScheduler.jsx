import React, { useState } from 'react';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘', bestTimes: '9am, 1pm, 3pm', maxChars: 63206 },
  { id: 'instagram', name: 'Instagram', icon: '📸', bestTimes: '11am, 2pm, 7pm', maxChars: 2200 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', bestTimes: '8am, 12pm, 5pm', maxChars: 3000 },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', bestTimes: '8am, 12pm, 6pm', maxChars: 280 },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', bestTimes: '7am, 12pm, 7pm', maxChars: 4000 },
];

export default function SocialScheduler() {
  const [platform, setPlatform] = useState('facebook');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('engagement');
  const [posts, setPosts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const goals = [
    { id: 'engagement', label: '📈 Engagement', desc: 'Likes, comments, shares' },
    { id: 'traffic', label: '🚦 Traffic', desc: 'Website visits' },
    { id: 'leads', label: '🎯 Leads', desc: 'Form fills & signups' },
    { id: 'sales', label: '💰 Sales', desc: 'Direct purchases' },
    { id: 'awareness', label: '📢 Awareness', desc: 'Brand visibility' },
  ];

  const activePlatform = PLATFORMS.find(p => p.id === platform);

  const generatePosts = async () => {
    if (!topic) { toast.error('Enter a topic'); return; }
    setGenerating(true);
    try {
      const result = await openRouterAI.callAI([{ 
        role: 'user', 
        content: `Create 7 social media posts for ${activePlatform?.name} about "${topic}". Goal: ${goal}. Return JSON: {"posts":[{"content":"Post text (under ${activePlatform?.maxChars} chars)","hashtags":["tag1","tag2","tag3"],"bestTime":"${activePlatform?.bestTimes.split(',')[0]}","visual":"Image/video idea","hook":"Opening hook"}]}` 
      }]);
      
      if (result?.posts) {
        setPosts(result.posts.map((p, i) => ({
          ...p,
          id: Date.now() + i,
          platform,
          scheduled: false,
          scheduledDate: '',
          scheduledTime: p.bestTime || '10:00',
        })));
        toast.success(`Generated ${result.posts.length} posts!`);
      }
    } catch {
      const fallbackPosts = Array.from({ length: 5 }, (_, i) => ({
        content: `${topic} - ${['Discover', 'Learn', 'Explore', 'Get', 'Try'][i]} the best solutions today!`,
        hashtags: ['#business', '#growth', '#marketing'],
        bestTime: activePlatform?.bestTimes.split(',')[i % 3]?.trim() || '10:00',
        visual: ['Product photo', 'Team picture', 'Infographic', 'Behind scenes', 'Customer testimonial'][i],
        hook: ['Did you know?', 'Stop scrolling!', 'New update:', 'Exclusive offer:', 'Quick tip:'][i],
      }));
      setPosts(fallbackPosts.map((p, i) => ({ ...p, id: Date.now() + i, platform, scheduled: false, scheduledDate: '', scheduledTime: p.bestTime })));
      toast.success('Generated fallback posts');
    } finally { setGenerating(false); }
  };

  const toggleSchedule = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, scheduled: !p.scheduled, scheduledDate: scheduledDate || new Date().toISOString().split('T')[0] } : p));
    toast.success('Post scheduled!');
  };

  const copyPost = (content) => { navigator.clipboard.writeText(content); toast.success('Copied!'); };

  const clearAll = () => { setPosts([]); setTopic(''); };

  const downloadCalendar = () => {
    const scheduled = posts.filter(p => p.scheduled);
    if (scheduled.length === 0) { toast.error('No scheduled posts'); return; }
    let text = 'SOCIAL MEDIA CALENDAR\n' + '='.repeat(40) + '\n\n';
    scheduled.forEach((p, i) => {
      text += `Post #${i+1} | ${p.scheduledDate} at ${p.scheduledTime}\n`;
      text += `Platform: ${PLATFORMS.find(pl=>pl.id===p.platform)?.name}\n`;
      text += `${p.content}\n`;
      text += `Hashtags: ${p.hashtags?.join(' ')}\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'social-calendar.txt'; a.click();
    toast.success('Calendar downloaded!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">📱 Social Media Scheduler</h1><p className="text-sm text-gray-500">Generate & schedule posts for all platforms</p></div>
        <div className="flex gap-2">
          {posts.length > 0 && <button onClick={clearAll} className="px-3 py-2 bg-gray-200 rounded-lg text-xs">Clear</button>}
          {posts.filter(p=>p.scheduled).length > 0 && <button onClick={downloadCalendar} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs">📥 Calendar</button>}
          <button onClick={generatePosts} disabled={generating || !topic} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {generating ? '⏳...' : '✨ Generate Posts'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">📋 Platform</h3>
            <div className="space-y-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`w-full p-3 rounded-lg text-left text-sm transition-all ${platform === p.id ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50 border hover:bg-gray-100'}`}>
                  <div className="flex justify-between"><span>{p.icon} {p.name}</span><span className="text-xs text-gray-400">{p.bestTimes}</span></div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">🎯 Goal</h3>
            <div className="space-y-1.5">{goals.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className={`w-full p-2.5 rounded-lg text-left text-sm ${goal === g.id ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <span className="font-medium">{g.label}</span><span className="text-xs text-gray-500 ml-2">{g.desc}</span>
              </button>
            ))}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="text-xs font-medium">Topic *</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Summer sale" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
            <label className="text-xs font-medium mt-3 block">Schedule Date</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
          </div>
        </div>

        {/* Posts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">📅 Posts ({posts.length})</h3>
              <span className="text-xs text-gray-500">{posts.filter(p=>p.scheduled).length} scheduled</span>
            </div>
            {posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📱</p><p>Select platform, enter topic, and generate posts</p></div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {posts.map((post, i) => (
                  <div key={post.id} className={`p-4 rounded-lg border ${post.scheduled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">#{i+1}</span>
                        <span className="text-xs text-gray-500">{PLATFORMS.find(p=>p.id===post.platform)?.icon} {post.bestTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.scheduled ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ {post.scheduledDate}</span>
                        ) : (
                          <button onClick={() => toggleSchedule(post.id)} className="text-xs text-blue-600 hover:underline">Schedule</button>
                        )}
                        <button onClick={() => copyPost(post.content)} className="text-xs text-gray-400 hover:text-gray-600">📋</button>
                      </div>
                    </div>
                    {post.hook && <p className="text-sm font-semibold text-purple-700 mb-1">{post.hook}</p>}
                    <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                    <div className="flex flex-wrap gap-1 mb-2">{post.hashtags?.map(t => <span key={t} className="text-xs text-blue-500">{t}</span>)}</div>
                    {post.visual && <p className="text-xs text-gray-400">🖼️ {post.visual}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}