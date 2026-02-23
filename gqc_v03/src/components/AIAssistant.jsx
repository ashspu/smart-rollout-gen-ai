import { useState, useEffect } from 'react';
import { X, Sparkles, Send, Bot, User, AlertTriangle, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { pecoProgram } from '../data/pecoProgram';

export default function AIAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I'm analyzing the **PECO AMI 2.0 Rollout** program. Here's what I see:

**Current Status:** Day ${pecoProgram.currentState.dayInProgram} of program execution

**Key Observations:**
• Program is **${Math.abs(pecoProgram.currentState.metrics.planVariance)}% behind plan** - within tolerance but trending
• **Cohort B (2011-2012 installs)** is the primary driver of variance
• **Montgomery County** has elevated no-access rates requiring attention

**Recommended Focus Areas:**
1. Accelerate Cohort B completion before Q2 milestone
2. Deploy customer outreach in Montgomery County
3. Monitor unbilled exposure - approaching $3M threshold

Would you like me to analyze any specific aspect of the program?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    { icon: AlertTriangle, text: 'What are the biggest risks to Q2 milestone?' },
    { icon: TrendingUp, text: 'Is the program definition realistic?' },
    { icon: Target, text: 'Which cohorts need more attention?' },
    { icon: Lightbulb, text: 'What signals indicate program success?' },
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      let response = '';
      
      if (input.toLowerCase().includes('risk') || input.toLowerCase().includes('q2')) {
        response = `**Q2 Milestone Risk Analysis**

Based on current trajectory and historical patterns:

**High Probability Risks:**
1. **Cohort B Delay** (8% behind) - If current pace continues, Q2 target will be missed by ~12,000 meters
2. **No-Access Clustering** - Montgomery County pattern suggests systemic issue, not random

**Structural Concerns:**
• Weather seasonality entering spring may help access rates
• Current first-time success rate (94.2%) is below 95% target

**Risk-Adjusted Q2 Outlook:**
• **Best case:** 95% of Q2 target (accelerated Cohort B focus)
• **Base case:** 91% of Q2 target (current trajectory)  
• **Downside:** 85% of Q2 target (if no-access spreads)

**I am NOT recommending:**
• Specific crew assignments
• Route changes
• Scheduling modifications

Those decisions belong to your execution systems. I'm identifying **what to watch** and **where risk is concentrating**.`;
      } else if (input.toLowerCase().includes('cohort')) {
        response = `**Cohort Attention Analysis**

Analyzing lifecycle signals across all cohorts:

**Immediate Attention Required:**
• **Cohort B (2011-2012)** - 8% behind plan, 0.12 failure probability
  - This cohort has the worst plan variance
  - Failure probability is elevated but not critical
  - Recommend increased monitoring, not panic

**On Track:**
• **Cohort A (2008-2010)** - Highest risk meters, but execution is solid
• **Cohort C (2013-2014)** - Early stage, no concerns

**Not Yet Started:**
• Cohorts D & E are scheduled for later phases

**Pattern I'm Watching:**
The gap between Cohort A and B performance suggests something changed in execution approach. Cohort A had more focus and resources. Cohort B may be suffering from "second wave fatigue."

This is a **planning insight**, not a scheduling directive.`;
      } else if (input.toLowerCase().includes('success') || input.toLowerCase().includes('signal')) {
        response = `**Success Signal Framework**

For the PECO AMI 2.0 program, success is defined by:

**Process Signals (must be present):**
✓ Completion rate tracking to plan (±5%)
✓ First-time success ≥95%
✓ Cycle time ≤5 days
✓ No cohort >10% behind schedule

**Business Signals (outcomes):**
✓ Unbilled exposure <$3.5M at any time
✓ Repeat visits <5% of population
✓ Customer complaints below baseline

**Regulatory Signals (commitments):**
✓ Annual milestone dates met
✓ Failure rate below 2% post-install
✓ Audit-ready documentation

**Current Signal Status:**
• 5 of 7 process signals: ✅ GREEN
• 2 of 3 business signals: ✅ GREEN
• 3 of 3 regulatory signals: ✅ GREEN (so far)

**The program is healthy but needs attention on Cohort B and Montgomery County to stay that way.**`;
      } else if (input.toLowerCase().includes('realistic') || input.toLowerCase().includes('definition')) {
        response = `**Program Definition Validation**

Analyzing the PECO AMI 2.0 program definition against historical patterns:

**Timeline Assessment:**
• 5-year program for 1.72M meters = 344K/year average
• Current Year 1 pace: ~440K (ahead of linear)
• **Assessment: Achievable** with current resource levels

**Milestone Realism:**
• Year 1 target appears achievable (currently 93% through)
• Year 2-3 acceleration is planned - this is where risk concentrates
• **Assessment: Aggressive but defensible**

**Risk Tolerance Bands:**
• 2% failure rate tolerance - historically appropriate
• 15% escalation threshold - may be too loose
• **Recommendation:** Consider 10% threshold for earlier intervention

**What I cannot assess:**
• Resource availability (not my domain)
• Budget constraints (not visible to me)
• External regulatory changes

**This program definition is internally consistent.** The main risk is the Year 2-3 acceleration assumption.`;
      } else {
        response = `I can help you analyze the PECO AMI 2.0 program. Here are areas I can assist with:

**Program Definition Analysis**
• Is the program internally consistent?
• Are milestones realistic?

**Risk Assessment**
• Where are structural risks emerging?
• What cohorts need attention?

**Success Criteria**
• What signals indicate success?
• Are we meeting regulatory commitments?

**I explicitly do not:**
• Assign crews or resources
• Create schedules or routes
• Override your execution systems

I'm a **planning intelligence layer**, not an operational tool.

What would you like to explore?`;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
              <p className="text-xs text-slate-500">Planning help only</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          <p className="text-xs text-amber-700">
            This AI helps with planning. It does not schedule crews or control field work.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'assistant' 
                  ? 'bg-purple-600' 
                  : 'bg-blue-600'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
              </div>
              <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl max-w-[90%] ${
                  msg.role === 'assistant' 
                    ? 'bg-white border border-slate-200 text-left shadow-sm' 
                    : 'bg-blue-600 text-white text-left'
                }`}>
                  <div className={`text-sm whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-slate-700' : 'text-white'}`}>
                    {msg.content.split('\n').map((line, i) => {
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={i} className={line === '' ? 'h-2' : 'mb-1'}>
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">Try asking:</p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q.text)}
                  className="w-full flex items-center gap-2 p-3 text-left text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                >
                  <q.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 bg-purple-600 rounded-lg text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
