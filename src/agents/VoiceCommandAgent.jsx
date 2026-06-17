import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function VoiceCommandAgent() {
  const navigate = useNavigate();
  const { leads, stats, runFullAutomation, addLeads } = useLeadStore();
  const { activeWorkflow, workflows, setActiveWorkflow } = useWorkflowStore();
  const { user } = useAuthStore();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processCommand(text);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Speak response
  const speak = (text) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }
    setTranscript('');
    setResponse('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (command) => {
    setProcessing(true);
    const cmd = command.toLowerCase();
    let actionResponse = '';
    let executed = false;

    // ============ NAVIGATION COMMANDS ============
    if (cmd.includes('go to dashboard') || cmd.includes('open dashboard') || cmd.includes('home')) {
      navigate('/');
      actionResponse = 'Opening dashboard now.';
      executed = true;
    }
    else if (cmd.includes('go to lead finder') || cmd.includes('find leads') || cmd.includes('open lead finder')) {
      navigate('/agents/find');
      actionResponse = 'Opening Lead Finder. Ready to discover new businesses!';
      executed = true;
    }
    else if (cmd.includes('go to website analyzer') || cmd.includes('analyze websites') || cmd.includes('open analyzer')) {
      navigate('/agents/analyze');
      actionResponse = 'Opening Website Analyzer. Ready to audit websites!';
      executed = true;
    }
    else if (cmd.includes('go to outreach') || cmd.includes('open outreach')) {
      navigate('/agents/outreach');
      actionResponse = 'Opening Outreach Agent. Ready to send emails!';
      executed = true;
    }
    else if (cmd.includes('go to appointments') || cmd.includes('open appointments') || cmd.includes('book meeting')) {
      navigate('/agents/book');
      actionResponse = 'Opening Appointment Setter. Ready to book meetings!';
      executed = true;
    }
    else if (cmd.includes('go to proposal') || cmd.includes('open proposal')) {
      navigate('/agents/proposal');
      actionResponse = 'Opening Proposal Builder. Ready to create proposals!';
      executed = true;
    }
    else if (cmd.includes('go to content') || cmd.includes('open content writer')) {
      navigate('/agents/content');
      actionResponse = 'Opening Content Writer. Ready to generate content!';
      executed = true;
    }
    else if (cmd.includes('go to roi') || cmd.includes('open roi calculator')) {
      navigate('/agents/roi');
      actionResponse = 'Opening ROI Calculator. Ready to calculate returns!';
      executed = true;
    }
    else if (cmd.includes('go to pipeline') || cmd.includes('open pipeline')) {
      navigate('/pipeline');
      actionResponse = 'Opening Pipeline View.';
      executed = true;
    }
    else if (cmd.includes('go to analytics') || cmd.includes('open analytics')) {
      navigate('/analytics');
      actionResponse = 'Opening Analytics Dashboard.';
      executed = true;
    }
    else if (cmd.includes('go to settings') || cmd.includes('open settings')) {
      navigate('/settings');
      actionResponse = 'Opening Settings.';
      executed = true;
    }
    else if (cmd.includes('go to admin') || cmd.includes('open admin panel')) {
      navigate('/admin');
      actionResponse = 'Opening Admin Panel.';
      executed = true;
    }

    // ============ FUNNEL COMMANDS ============
    else if (cmd.includes('switch to marketing') || cmd.includes('marketing funnel')) {
      setActiveWorkflow('marketing');
      actionResponse = 'Switched to Marketing Funnel. Targeting digital marketing leads.';
      executed = true;
    }
    else if (cmd.includes('switch to accounting') || cmd.includes('accounting funnel')) {
      setActiveWorkflow('accounting');
      actionResponse = 'Switched to Accounting Funnel. Targeting accounting leads.';
      executed = true;
    }

    // ============ ACTION COMMANDS ============
    else if (cmd.includes('find new leads') || cmd.includes('search for leads') || cmd.includes('discover leads')) {
      navigate('/agents/find');
      actionResponse = `Opening Lead Finder. You have ${stats.total} total leads with ${stats.new} new ones. Let's find more!`;
      executed = true;
    }
    else if (cmd.includes('run pipeline') || cmd.includes('start automation') || cmd.includes('run automation')) {
      if (stats.new > 0) {
        runFullAutomation(activeWorkflow);
        actionResponse = `Starting AI pipeline for ${activeWorkflow} funnel. Processing ${stats.new} new leads through all 7 agents.`;
      } else {
        actionResponse = 'No new leads to process. Find leads first by saying "find new leads".';
      }
      executed = true;
    }
    else if (cmd.includes('how many leads') || cmd.includes('lead count') || cmd.includes('stats')) {
      actionResponse = `You have ${stats.total} total leads. ${stats.new} new, ${stats.analyzed} analyzed, ${stats.qualified} qualified, and ${stats.meetings} meetings booked.`;
      executed = true;
    }
    else if (cmd.includes('what is my plan') || cmd.includes('my account')) {
      actionResponse = `You are on the ${user?.plan || 'Free'} plan. You have used ${stats.total} out of ${user?.usageStats?.maxLeads || 100} leads this month.`;
      executed = true;
    }

    // ============ QUICK GENERATION COMMANDS ============
    else if (cmd.includes('generate leads') || cmd.includes('create sample leads')) {
      const niche = cmd.includes('dentist') ? 'Dentist' : cmd.includes('lawyer') ? 'Law Firm' : cmd.includes('restaurant') ? 'Restaurant' : 'Medical Clinic';
      const city = cmd.includes('new york') ? 'New York' : cmd.includes('los angeles') ? 'Los Angeles' : cmd.includes('chicago') ? 'Chicago' : 'New York';
      const count = cmd.includes('5') ? 5 : cmd.includes('10') ? 10 : 3;
      
      const newLeads = Array.from({length: count}, (_, i) => ({
        businessName: `${['ABC','Premier','Elite','City','Metro','Golden'][i]} ${niche}`,
        industry: niche,
        website: `https://www.${niche.toLowerCase().replace(/\s/g,'')}${i}.com`,
        email: `info@${niche.toLowerCase().replace(/\s/g,'')}${i}.com`,
        phone: `+1 (555) ${String(Math.floor(Math.random()*900)+100)}-${String(Math.floor(Math.random()*9000)+1000)}`,
        city, state: 'NY', country: 'US',
        source: 'voice_command', status: 'new', score: Math.floor(Math.random()*20)+10,
      }));
      addLeads(newLeads, activeWorkflow);
      actionResponse = `Generated ${count} ${niche} leads in ${city}. They are now in your ${activeWorkflow} funnel.`;
      executed = true;
    }

    // ============ HELP COMMANDS ============
    else if (cmd.includes('what can you do') || cmd.includes('help') || cmd.includes('commands')) {
      actionResponse = 'I can help you navigate the app, find leads, run the AI pipeline, check stats, switch funnels, and generate sample leads. Try saying: go to dashboard, find leads, run pipeline, how many leads, or switch to marketing.';
      executed = true;
    }
    else if (cmd.includes('hello') || cmd.includes('hi') || cmd.includes('hey')) {
      const greetings = ['Hello! How can I help you today?', 'Hi there! What would you like to do?', 'Hey! Ready to generate some leads?', 'Welcome back! What can I assist you with?'];
      actionResponse = greetings[Math.floor(Math.random() * greetings.length)];
      executed = true;
    }
    else if (cmd.includes('thank')) {
      actionResponse = "You're welcome! Happy to help. Let me know if you need anything else.";
      executed = true;
    }

    // ============ AI FALLBACK ============
    if (!executed) {
      try {
        const aiResult = await openRouterAI.callAI([{ 
          role: 'user', 
          content: `A user said: "${command}". Determine what they want. Options: navigate(page), runPipeline, showStats, findLeads, switchFunnel, or unknown. Return JSON: {"action":"actionName","response":"Helpful response","data":{"page":"optional page to navigate to"}}` 
        }]);
        actionResponse = aiResult?.response || "I'm not sure what you mean. Try saying 'help' to see what I can do.";
        if (aiResult?.action === 'navigate' && aiResult?.data?.page) {
          navigate(aiResult.data.page);
        }
      } catch {
        actionResponse = "I didn't understand that. Try saying: go to dashboard, find leads, run pipeline, or help.";
      }
    }

    setResponse(actionResponse);
    speak(actionResponse);
    setHistory(prev => [{ id: Date.now(), command, response: actionResponse, time: new Date().toISOString() }, ...prev].slice(0, 50));
    setProcessing(false);
  };

  const handleTextCommand = (e) => {
    e.preventDefault();
    if (transcript.trim()) {
      processCommand(transcript);
    }
  };

  const quickCommands = [
    { label: '📊 Stats', command: 'how many leads' },
    { label: '🔍 Find', command: 'find new leads' },
    { label: '🚀 Pipeline', command: 'run pipeline' },
    { label: '📈 Marketing', command: 'switch to marketing' },
    { label: '📊 Accounting', command: 'switch to accounting' },
    { label: '🏠 Home', command: 'go to dashboard' },
    { label: '📄 Proposal', command: 'go to proposal' },
    { label: '💰 ROI', command: 'go to roi calculator' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎙️ Voice Command Agent</h1>
          <p className="text-sm text-gray-500">Control the entire system with voice or text commands</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setVoiceEnabled(!voiceEnabled); toast.success(`Voice ${voiceEnabled ? 'disabled' : 'enabled'}`); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${voiceEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
            {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
          </button>
        </div>
      </div>

      {/* Voice Input Area */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center shadow-xl">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${isListening ? 'bg-red-500 animate-pulse scale-110' : speaking ? 'bg-green-500' : 'bg-white/20'}`}>
          <span className="text-4xl">🎙️</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isListening ? 'Listening...' : speaking ? 'Speaking...' : processing ? 'Processing...' : 'Tap to Speak'}
        </h2>
        <p className="text-purple-100 text-sm mb-6">
          {isListening ? 'Speak your command now...' : 'Click the microphone and give a voice command'}
        </p>
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
            isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-white text-purple-700 hover:bg-purple-50'
          }`}>
          {isListening ? '⏹️ Stop' : '🎤 Start Listening'}
        </button>
      </div>

      {/* Text Input */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <form onSubmit={handleTextCommand} className="flex gap-2">
          <input
            type="text"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Or type your command here... (e.g., find leads, run pipeline, show stats)"
            className="flex-1 px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" disabled={processing || !transcript.trim()} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50">
            {processing ? '⏳' : '➤'}
          </button>
        </form>
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2">
        {quickCommands.map(qc => (
          <button key={qc.label} onClick={() => { setTranscript(qc.command); processCommand(qc.command); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-purple-50 hover:border-purple-200 transition-colors">
            {qc.label}
          </button>
        ))}
      </div>

      {/* Response */}
      {response && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-green-800 mb-1">AI Response</p>
              <p className="text-green-700">{response}</p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">📋 Command History ({history.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map(h => (
              <div key={h.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-sm">🎙️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{h.command}</p>
                    <p className="text-xs text-gray-500 mt-1">{h.response}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(h.time).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Commands */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4">💡 Available Commands</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {[
            { cmd: 'Go to dashboard', desc: 'Navigate to home' },
            { cmd: 'Find new leads', desc: 'Open Lead Finder' },
            { cmd: 'Run pipeline', desc: 'Start AI automation' },
            { cmd: 'How many leads', desc: 'Show statistics' },
            { cmd: 'Switch to marketing', desc: 'Switch funnel' },
            { cmd: 'Switch to accounting', desc: 'Switch funnel' },
            { cmd: 'Generate 5 dentist leads', desc: 'Create sample leads' },
            { cmd: 'Go to proposal', desc: 'Open Proposal Builder' },
            { cmd: 'Go to ROI calculator', desc: 'Open ROI Calculator' },
            { cmd: 'What can you do', desc: 'List all commands' },
            { cmd: 'Go to appointments', desc: 'Open Appointments' },
            { cmd: 'Go to analytics', desc: 'Open Analytics' },
          ].map((c, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-purple-50" onClick={() => { setTranscript(c.cmd); processCommand(c.cmd); }}>
              <p className="font-medium text-gray-700">"{c.cmd}"</p>
              <p className="text-xs text-gray-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}