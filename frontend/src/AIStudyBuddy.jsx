import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';
import { useTranslation } from 'react-i18next';

function AIStudyBuddy({ user, query = "" }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(query);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Use streaming for AI responses
  const aiStreaming = useStreaming();

  // Context for agents and README (optional, non-breaking)
  const [agentsBrief, setAgentsBrief] = useState("");
  const [agentOptions, setAgentOptions] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [useReadme, setUseReadme] = useState(false);
  const [readmeSnippet, setReadmeSnippet] = useState("");

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: t('help.aiStudyBuddy.welcome', {
            defaultValue:
              "👋 Hello! I'm your AI Study Buddy. I'm here to help you with any questions about workplace learning, micro-lessons, simulations, or career development.\n\nWhat would you like to learn about today?"
          }),
          timestamp: new Date()
        }
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user switches language while only the welcome message is present, update it
  useEffect(() => {
    const welcome = t('help.aiStudyBuddy.welcome', {
      defaultValue:
        "👋 Hello! I'm your AI Study Buddy. I'm here to help you with any questions about workplace learning, micro-lessons, simulations, or career development.\n\nWhat would you like to learn about today?"
    });
    if (messages.length === 1 && messages[0]?.type === 'ai' && messages[0]?.id === 1 && messages[0].content !== welcome) {
      setMessages([{ ...messages[0], content: welcome }]);
    }
  }, [t, messages]);

  // Load agent catalog (concise) once
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/agents/catalog');
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        // Build options for quick selector
        const options = (items || []).map((a) => ({
          id: a.id || a.agent_id || a.slug || (a.name || a.title || 'agent').toLowerCase().replace(/\s+/g, '-'),
          name: a.name || a.title || 'Agent'
        }));
        setAgentOptions(options);
        const briefLines = (items || []).map((a) => {
          const name = a.name || a.title || 'Agent';
          const desc = (a.description || a.summary || '').replace(/\s+/g, ' ').trim();
          const short = desc.length > 120 ? desc.slice(0, 120) + '…' : desc;
          return `- ${name}: ${short}`;
        });
        setAgentsBrief(briefLines.slice(0, 12).join('\n'));
      } catch (e) {
        // ignore silently to keep current behavior
      }
    };
    loadAgents();
  }, []);

  // Load README when toggle is on
  useEffect(() => {
    const fetchReadme = async () => {
      if (!useReadme) { setReadmeSnippet(''); return; }
      try {
        const res = await fetch('/api/readme');
        const data = await res.json();
        if (data?.success && data?.markdown) {
          setReadmeSnippet(data.markdown.slice(0, 2500));
        } else {
          setReadmeSnippet('');
        }
      } catch {
        setReadmeSnippet('');
      }
    };
    fetchReadme();
  }, [useReadme]);

  // Handle initial query if provided
  useEffect(() => {
    if (query && query.trim() && messages.length === 1) {
      handleSendMessage(query);
    }
  }, [query, messages.length]);

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Track AI Study Buddy usage for knowledge map
    const currentProgress = JSON.parse(localStorage.getItem('ai_learning_progress_user') || '{}');
    const updatedProgress = {
      ...currentProgress,
      aiStudyBuddySessions: (currentProgress.aiStudyBuddySessions || 0) + 1,
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem('ai_learning_progress_user', JSON.stringify(updatedProgress));

    // Trigger progress update event
    window.dispatchEvent(new CustomEvent('progressUpdated', { 
      detail: { progress: updatedProgress, updates: { aiStudyBuddySessions: 1 } } 
    }));

    // Generate AI response using streaming
    const readmeContext = useReadme && readmeSnippet ? `\n\nREADME context (truncated):\n${readmeSnippet}` : '';

    // Try to match question to a known agent for a focused answer
    const findBestAgent = (q) => {
      try {
        const ql = q.toLowerCase();
        const names = (agentsBrief && agentsBrief.split('\n')) || [];
        // We also keep a parsed list from the catalog fetch by reusing brief lines
        // Simple match: pick first line containing a word from the question
        let best = null;
        let bestScore = 0;
        const tokens = ql.split(/[^a-z0-9]+/).filter(Boolean);
        names.forEach((line) => {
          const name = line.replace(/^[-\s]*/, '').split(':')[0] || '';
          const nl = name.toLowerCase();
          const overlap = tokens.filter(t => nl.includes(t)).length;
          if (overlap > bestScore) { bestScore = overlap; best = name; }
        });
        return bestScore > 0 ? best : null;
      } catch { return null; }
    };

    const matchedAgentName = findBestAgent(messageText);

    const focusedPromptForAgent = (agentName) => `Answer ONLY about "${agentName}".
- What it does (1–2 lines)
- How to demo it in the UI (path + botones exactos)
- Key API endpoints
- Required env vars/external services
- 3 value bullets
Formato: 7–10 líneas, con viñetas, sin preámbulos, sin otros agentes.`;

    const generalPrompt = `User question: "${messageText}"
Responde de forma directa y breve (5–8 líneas). Usa viñetas si ayuda. Evita información no solicitada.`;

    const promptToUse = matchedAgentName ? focusedPromptForAgent(matchedAgentName) : generalPrompt;

    aiStreaming.startStreaming(
      promptToUse,
      {
        statusMessages: STATUS_MESSAGES.QA,
        onComplete: (content) => {
          console.log('AIStudyBuddy onComplete called with content length:', content?.length);
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: content || 'No response received',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
        },
        onError: (error) => {
          const errorMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: `Sorry, I encountered an error: ${error}. Please try asking your question again.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
        }
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    t('help.aiStudyBuddy.suggested.0', { defaultValue: 'What are micro-lessons and how do they work?' }),
    t('help.aiStudyBuddy.suggested.1', { defaultValue: 'How can AI help with career development?' }),
    t('help.aiStudyBuddy.suggested.2', { defaultValue: 'What is skills forecasting?' }),
    t('help.aiStudyBuddy.suggested.3', { defaultValue: 'Tell me about scenario simulations' }),
    t('help.aiStudyBuddy.suggested.4', { defaultValue: 'How do I track my learning progress?' })
  ];

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '0 auto', 
      height: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: colors.cardBackground,
        borderRadius: '12px 12px 0 0',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '2em' }}>🤖</div>
        <div>
          <h2 style={{ margin: 0, color: colors.text }}>{t('help.aiStudyBuddy.title', { defaultValue: 'AI Study Buddy' })}</h2>
          <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
            {t('help.aiStudyBuddy.subtitle', { defaultValue: 'Your intelligent learning assistant' })}
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        background: colors.background,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '8px'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: message.type === 'user' ? colors.primary : colors.cardBackground,
              color: message.type === 'user' ? '#fff' : colors.text,
              border: message.type === 'ai' ? `1px solid ${colors.border}` : 'none',
              fontSize: '0.95em',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap'
            }}>
              {message.content}
              <div style={{
                fontSize: '0.75em',
                opacity: 0.7,
                marginTop: '8px',
                textAlign: message.type === 'user' ? 'right' : 'left'
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              background: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              fontSize: '0.9em'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '1.2em' }}>🤔</div>
                <div>{t('help.aiStudyBuddy.aiThinking', { defaultValue: 'AI is thinking...' })}</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div style={{
          padding: '16px',
          background: colors.cardBackground,
          borderTop: `1px solid ${colors.border}`
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: colors.text, fontSize: '0.9em' }}>
            {t('help.aiStudyBuddy.suggestedTitle', { defaultValue: '💡 Suggested Questions:' })}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  fontSize: '0.8em',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primaryLight;
                  e.target.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.background;
                  e.target.style.borderColor = colors.border;
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '20px',
        background: colors.cardBackground,
        borderRadius: '0 0 12px 12px',
        borderTop: `1px solid ${colors.border}`
      }}>
        {/* Controls Row: README toggle + Agent selector */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: 12 }}>
          {/* Toggle for README context (non-intrusive) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85em', color: colors.textSecondary }}>
            <input
              type="checkbox"
              checked={useReadme}
              onChange={(e) => setUseReadme(e.target.checked)}
              style={{ transform: 'scale(1.1)' }}
            />
            {t('help.aiStudyBuddy.useReadme', { defaultValue: 'Use README context' })}
          </label>

          {/* Quick Agent Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85em', color: colors.textSecondary }}>{t('help.aiStudyBuddy.agentLabel', { defaultValue: 'Agent:' })}</span>
            <select
              value={selectedAgent}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedAgent(name);
                if (name) {
                  setInputMessage(`Explain ${name}`);
                }
              }}
              style={{
                minWidth: 220,
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '0.9em'
              }}
            >
              <option value="">{t('help.aiStudyBuddy.selectPlaceholder', { defaultValue: 'Select an agent…' })}</option>
              {agentOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>{opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* README Preview (3–4 lines) */}
        {useReadme && readmeSnippet && (
          <div style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: colors.background,
            color: colors.textSecondary,
            fontSize: '0.85em',
            whiteSpace: 'pre-wrap'
          }}>
            {(readmeSnippet.split('\n').slice(0, 4).join('\n')).trim()}
            {readmeSnippet.split('\n').length > 4 ? ' …' : ''}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('help.aiStudyBuddy.inputPlaceholder', { defaultValue: 'Ask me anything about workplace learning...' })}
            disabled={isTyping}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              fontSize: '0.95em',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            style={{
              padding: '12px 20px',
              borderRadius: '24px',
              border: 'none',
              background: !inputMessage.trim() || isTyping ? colors.border : colors.primary,
              color: '#fff',
              cursor: !inputMessage.trim() || isTyping ? 'not-allowed' : 'pointer',
              fontSize: '0.95em',
              fontWeight: '500'
            }}
          >
            {isTyping ? '⏳' : '💬'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIStudyBuddy; 