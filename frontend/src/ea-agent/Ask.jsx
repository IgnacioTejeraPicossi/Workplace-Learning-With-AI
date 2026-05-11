import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  accentButtonStyle,
  attentionCardStyle,
  attentionPanelStyle,
} from './sharedUi';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const SAMPLE_QUESTIONS = [
  'Which applications are running Java 8 and need urgent migration?',
  'What are the top security risks in our portfolio?',
  'Which technologies are approaching end-of-life?',
  'Show me all critical applications and their tech stacks',
  'What compliance deadlines should we prepare for?',
  'Which teams own the most critical systems?',
];

const Ask = () => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [history, setHistory] = useState([]);

  const askQuestion = async (q) => {
    const questionText = q || question;
    if (!questionText.trim()) return;
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch(`${API}/api/ea-brain/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          context: context || undefined,
          include_insights: true,
          include_portfolio: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data);
        setHistory(prev => [{ question: questionText, answer: data, timestamp: new Date() }, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.error('Ask error:', err);
      setAnswer({ answer_md: 'Error connecting to the backend. Is the server running?', confidence: 0 });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <AttentionPage>
      <AttentionHero
        icon="🔍"
        title={t('eaSecondBrainModule.askTitle')}
        subtitle={t('eaSecondBrainModule.askSubtitle')}
      />

      <div style={attentionCardStyle}>
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('eaSecondBrainModule.askPlaceholder')}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none resize-none text-base"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t('eaSecondBrainModule.askContextPlaceholder')}
            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={() => askQuestion()}
            disabled={loading || !question.trim()}
            style={{
              ...accentButtonStyle('blue'),
              opacity: loading || !question.trim() ? 0.55 : 1,
              cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('eaSecondBrainModule.thinking')}
              </>
            ) : (
              <>🔍 {t('eaSecondBrainModule.askBtn')}</>
            )}
          </button>
        </div>
      </div>

      <div style={attentionCardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{t('eaSecondBrainModule.sampleQuestions')}</h3>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((sq, i) => (
            <button
              key={i}
              onClick={() => { setQuestion(sq); askQuestion(sq); }}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer */}
      {answer && (
        <div style={attentionPanelStyle}>
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(90deg, #eff6ff 0%, #faf5ff 100%)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">🧠 {t('eaSecondBrainModule.answerTitle')}</h3>
              {answer.confidence != null && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  answer.confidence >= 0.7 ? 'bg-green-100 text-green-700' :
                  answer.confidence >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {t('eaSecondBrainModule.confidence')}: {(answer.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Main answer */}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {answer.answer_md}
            </div>

            {/* Related portfolio items */}
            {answer.related_portfolio_items?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.relatedPortfolio')}</h4>
                <div className="flex flex-wrap gap-2">
                  {answer.related_portfolio_items.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                      🏗️ {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related insights */}
            {answer.related_insights?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.relatedInsights')}</h4>
                <div className="flex flex-wrap gap-2">
                  {answer.related_insights.map((ins, i) => (
                    <span key={i} className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                      💡 {ins}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {answer.suggestions?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.followUpQuestions')}</h4>
                <div className="space-y-1">
                  {answer.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuestion(s); askQuestion(s); }}
                      className="block w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div style={attentionCardStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
            {t('eaSecondBrainModule.recentQuestions')}
          </h3>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuestion(h.question); askQuestion(h.question); }}
                className="block w-full text-left px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-700">{h.question}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {h.timestamp.toLocaleTimeString()} — {t('eaSecondBrainModule.confidence')}: {(h.answer?.confidence * 100 || 0).toFixed(0)}%
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </AttentionPage>
  );
};

export default Ask;
