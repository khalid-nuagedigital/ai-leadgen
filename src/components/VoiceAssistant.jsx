import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, runFullAutomation, addLeads } = useLeadStore();
  const { activeWorkflow, setActiveWorkflow } = useWorkflowStore();
  const { user } = useAuthStore();

  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) executeVoiceCommand(text);
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') toast.error('Allow microphone');
      if (e.error !== 'no-speech') setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch { setIsListening(false); }
      }
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) { toast.error('Use Chrome browser'); return; }
    setIsListening(true);
    setResponse(''); setShowResponse(false);
    try { recognitionRef.current.start(); } catch { setIsListening(false); }
    toast.success('🎤 Listening continuously...', { duration: 1500 });
  };

  const stopListening = () => {
    setIsListening(false);
    try { recognitionRef.current?.stop(); } catch {}
  };

  const speak = (text) => {
    synthRef.current?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85; u.pitch = 1;
    synthRef.current?.speak(u);
  };

  // Find clickable element by text
  const findAndClick = (text) => {
    const elements = document.querySelectorAll('button, a, [role="button"], input[type="submit"], input[type="button"], .btn, [onclick]');
    for (const el of elements) {
      const elText = (el.textContent || el.value || el.getAttribute('aria-label') || el.title || '').toLowerCase().trim();
      if (elText && elText.includes(text.toLowerCase()) && !el.disabled && el.offsetParent !== null) {
        el.click();
        return elText;
      }
    }
    return null;
  };

  // Find and fill input
  const findAndFill = (label, value) => {
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    for (const input of inputs) {
      const placeholder = (input.placeholder || '').toLowerCase();
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      let labelText = '';
      if (input.labels?.[0]) labelText = input.labels[0].textContent.toLowerCase();

      if (placeholder.includes(label) || ariaLabel.includes(label) || name.includes(label) || id.includes(label) || labelText.includes(label)) {
        if (input.tagName === 'SELECT') {
          for (const opt of input.options) {
            if (opt.text.toLowerCase().includes(value)) {
              input.value = opt.value;
              input.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
        } else if (input.type === 'checkbox' || input.type === 'radio') {
          input.click();
          return true;
        } else {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.focus();
          return true;
        }
      }
    }
    return false;
  };

  // Check all checkboxes
  const toggleAllCheckboxes = (check) => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => { if (!cb.disabled && cb.offsetParent !== null) cb.checked = check; });
    return checkboxes.length;
  };

  const executeVoiceCommand = (cmd) => {
    const c = cmd.toLowerCase().trim();
    let reply = '';

    // ============ CLICK BUTTONS ============
    if (c.startsWith('click ') || c.startsWith('press ') || c.startsWith('tap ') || c.startsWith('hit ')) {
      const btnName = c.replace(/^(click|press|tap|hit)\s+/i, '').trim();
      const clicked = findAndClick(btnName);
      reply = clicked ? `✅ Clicked "${clicked}"` : `❌ No button found for "${btnName}"`;
    }

    // ============ TYPE / FILL ============
    else if (c.startsWith('type ') || c.startsWith('write ') || c.startsWith('fill ') || c.startsWith('enter ')) {
      const text = c.replace(/^(type|write|fill|enter)\s+/i, '');
      const inIdx = text.lastIndexOf(' in ') > -1 ? text.lastIndexOf(' in ') : text.lastIndexOf(' into ');
      if (inIdx > -1) {
        const value = text.substring(0, inIdx).trim();
        const field = text.substring(inIdx + 4).trim();
        const filled = findAndFill(field, value);
        reply = filled ? `✅ Filled "${value}" in ${field}` : `❌ No field found for "${field}"`;
      } else {
        reply = 'Say: type [text] in [field name]';
      }
    }

    // ============ CHECK / UNCHECK ============
    else if (c === 'check all' || c === 'select all') {
      const count = toggleAllCheckboxes(true);
      reply = `✅ Checked ${count} checkboxes`;
    }
    else if (c === 'uncheck all' || c === 'deselect all') {
      const count = toggleAllCheckboxes(false);
      reply = `✅ Unchecked ${count} checkboxes`;
    }
    else if (c.startsWith('check ') || c.startsWith('select ')) {
      const item = c.replace(/^(check|select)\s+/i, '');
      const labels = document.querySelectorAll('label');
      for (const l of labels) {
        if (l.textContent.toLowerCase().includes(item)) { l.click(); reply = `✅ Checked ${item}`; break; }
      }
      if (!reply) reply = `❌ Not found: ${item}`;
    }

    // ============ SCROLL ============
    else if (c === 'scroll down' || c === 'down') { window.scrollBy({ top: 400, behavior: 'smooth' }); reply = '⬇️ Scrolled down'; }
    else if (c === 'scroll up' || c === 'up') { window.scrollBy({ top: -400, behavior: 'smooth' }); reply = '⬆️ Scrolled up'; }
    else if (c === 'scroll to top' || c === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); reply = '🔝 Top'; }
    else if (c === 'scroll to bottom' || c === 'bottom') { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); reply = '🔚 Bottom'; }

    // ============ NAVIGATION ============
    else if (c.includes('dashboard') || c === 'home') { navigate('/'); reply = '📊 Dashboard'; }
    else if (c.includes('find lead') || c.includes('lead finder')) { navigate('/agents/find'); reply = '🔍 Lead Finder'; }
    else if (c.includes('analyz') || c.includes('audit')) { navigate('/agents/analyze'); reply = '🌐 Analyzer'; }
    else if (c.includes('outreach')) { navigate('/agents/outreach'); reply = '📧 Outreach'; }
    else if (c.includes('appointment') || c.includes('book') || c.includes('meeting')) { navigate('/agents/book'); reply = '📅 Appointments'; }
    else if (c.includes('proposal')) { navigate('/agents/proposal'); reply = '📄 Proposal'; }
    else if (c.includes('content') || c.includes('writer')) { navigate('/agents/content'); reply = '✍️ Content'; }
    else if (c.includes('roi') || c.includes('calculator')) { navigate('/agents/roi'); reply = '💰 ROI'; }
    else if (c.includes('pipeline')) { navigate('/pipeline'); reply = '📈 Pipeline'; }
    else if (c.includes('analytics')) { navigate('/analytics'); reply = '📊 Analytics'; }
    else if (c.includes('settings')) { navigate('/settings'); reply = '⚙️ Settings'; }
    else if (c.includes('social')) { navigate('/agents/social'); reply = '📱 Social'; }
    else if (c.includes('review')) { navigate('/agents/reviews'); reply = '⭐ Reviews'; }
    else if (c.includes('referral')) { navigate('/agents/referral'); reply = '🔗 Referral'; }
    else if (c.includes('competitor')) { navigate('/agents/competitor'); reply = '🔍 Competitor'; }
    else if (c.includes('admin')) { navigate('/admin'); reply = '🛡️ Admin'; }
    else if (c === 'go back' || c === 'back') { navigate(-1); reply = '⬅️ Back'; }
    else if (c === 'go forward' || c === 'forward') { navigate(1); reply = '➡️ Forward'; }
    else if (c === 'refresh' || c === 'reload') { window.location.reload(); reply = '🔄 Refreshed'; }

    // ============ FUNNEL ============
    else if (c.includes('marketing')) { setActiveWorkflow('marketing'); reply = '📈 Marketing Funnel'; }
    else if (c.includes('accounting')) { setActiveWorkflow('accounting'); reply = '📊 Accounting Funnel'; }

    // ============ ACTIONS ============
    else if (c.includes('run') || c.includes('start') || c.includes('automate')) {
      if (stats.new > 0) { runFullAutomation(activeWorkflow); reply = `🚀 Pipeline running on ${stats.new} leads`; }
      else { reply = '⚠️ No new leads'; }
    }
    else if (c.includes('stats') || c.includes('how many')) {
      reply = `📊 ${stats.total} leads. ${stats.new} new, ${stats.qualified} qualified, ${stats.meetings} meetings`;
    }
    else if (c.includes('generate') || c.includes('create lead')) {
      const niche = c.includes('dentist') ? 'Dentist' : c.includes('lawyer') ? 'Law Firm' : 'Medical Clinic';
      const count = 5;
      const newLeads = Array.from({length: count}, (_, i) => ({
        businessName: `${['ABC','Premier','Elite','City','Metro'][i]} ${niche}`,
        industry: niche, city: 'New York', website: `https://www.${niche.toLowerCase()}${i}.com`,
        email: `info@${niche.toLowerCase()}${i}.com`, phone: `+1 (555) ${String(Math.floor(Math.random()*900)+100)}-${String(Math.floor(Math.random()*9000)+1000)}`,
        state: 'NY', country: 'US', source: 'voice', status: 'new', score: Math.floor(Math.random()*20)+10,
      }));
      addLeads(newLeads, activeWorkflow);
      reply = `✅ Created ${count} ${niche} leads`;
    }

    // ============ SUBMIT / SAVE / CANCEL ============
    else if (c === 'submit' || c === 'save') {
      const clicked = findAndClick('submit') || findAndClick('save') || findAndClick('send');
      reply = clicked ? '✅ Submitted' : '❌ No submit button';
    }
    else if (c === 'cancel' || c === 'close') {
      const clicked = findAndClick('cancel') || findAndClick('close') || findAndClick('✕') || findAndClick('x');
      reply = clicked ? '✅ Closed' : '❌ No cancel button';
    }
    else if (c === 'clear' || c === 'reset') {
      const clicked = findAndClick('clear') || findAndClick('reset');
      reply = clicked ? '✅ Cleared' : '❌ No clear button';
    }

    // ============ GREETINGS ============
    else if (c.match(/^(hi|hello|hey|yo)/)) { reply = 'Hello! How can I help?'; }
    else if (c.includes('thank')) { reply = 'You\'re welcome! 😊'; }
    else if (c === 'help' || c === 'commands') {
      reply = 'Commands: click [name], type [text] in [field], check all, scroll, dashboard, find leads, run pipeline, stats, marketing, accounting, generate leads, submit, cancel, help';
    }
    else {
      // Try clicking as fallback
      const clicked = findAndClick(c);
      reply = clicked ? `✅ Clicked "${clicked}"` : 'Try: help, dashboard, find leads, run pipeline, stats';
    }

    if (reply) {
      setResponse(reply);
      setShowResponse(true);
      speak(reply);
      setTimeout(() => setShowResponse(false), 6000);
    }
  };

  if (['/login', '/register', '/pricing'].includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Response */}
      {showResponse && response && (
        <div className="bg-white border border-gray-200 shadow-lg rounded-2xl rounded-br-md p-3 max-w-xs animate-in">
          <p className="text-sm text-gray-700">{response}</p>
          <button onClick={() => setShowResponse(false)} className="text-xs text-gray-400 mt-1">✕</button>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay:'0.2s'}}></span>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay:'0.4s'}}></span>
          </div>
          <span className="text-xs">Listening...</span>
        </div>
      )}

      {/* Mic Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isListening 
            ? 'bg-green-500 text-white scale-110 shadow-green-300 ring-4 ring-green-200' 
            : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white hover:scale-105 shadow-purple-300'
        }`}
        title={isListening ? 'Stop' : 'Voice Control'}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>
    </div>
  );
}