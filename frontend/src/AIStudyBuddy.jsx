import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';

function AIStudyBuddy({ user, query = "" }) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(query);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Use streaming for AI responses
  const aiStreaming = useStreaming();

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
          content: `👋 Hello! I'm your AI Study Buddy. I'm here to help you with any questions about workplace learning, micro-lessons, simulations, or career development. 

What would you like to learn about today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, []);

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
    aiStreaming.startStreaming(
      `You are an AI Study Buddy for a workplace learning platform. A user is asking questions about learning content, career development, or workplace skills.

User Question: "${messageText}"

Context about the platform:
- This is an AI-powered workplace learning platform
- Features include: AI Concepts Generation, Micro-lessons, Scenario Simulator, AI Career Coach, Skills Forecasting, Team Dynamics Analyzer, Certifications, Video Lessons
- The platform uses GPT-4 for content generation
- Users can save lessons and track progress

Please provide a helpful, educational response that:
1. Directly answers the user's question
2. Provides practical examples when relevant
3. Suggests related learning opportunities
4. Maintains a friendly, encouraging tone
5. Keeps responses concise but informative

If the user asks about specific features, explain how they work and their benefits.`,
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
    "What are micro-lessons and how do they work?",
    "How can AI help with career development?",
    "What is skills forecasting?",
    "Tell me about scenario simulations",
    "How do I track my learning progress?"
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
          <h2 style={{ margin: 0, color: colors.text }}>AI Study Buddy</h2>
          <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
            Your intelligent learning assistant
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
                <div>AI is thinking...</div>
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
            💡 Suggested Questions:
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about workplace learning..."
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