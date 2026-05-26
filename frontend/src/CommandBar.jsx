import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { postRoute, askStream } from './api';
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import ModalDialog from './ModalDialog';

const getConfidenceLevels = (t) => [
  { key: 'High', label: t('askAI.confidence.high'), value: 2, tooltip: t('askAI.confidence.highTooltip') },
  { key: 'Medium', label: t('askAI.confidence.medium'), value: 1, tooltip: t('askAI.confidence.mediumTooltip') },
  { key: 'Low', label: t('askAI.confidence.low'), value: 0, tooltip: t('askAI.confidence.lowTooltip') },
];

function confidenceToValue(conf) {
  if (!conf) return 0;
  if (conf.toLowerCase() === 'high') return 2;
  if (conf.toLowerCase() === 'medium') return 1;
  return 0;
}

function CommandBar({ onRoute, inputPlaceholder }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamedOutput, setStreamedOutput] = useState('');
  const [unknownIntent, setUnknownIntent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState('High');
  const [clarification, setClarification] = useState("");
  const [clarifying, setClarifying] = useState(false);
  const [notification, setNotification] = useState("");
  // const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const moduleMap = {
    // AI Concepts
    concepts: 'ai-concepts',
    concept: 'ai-concepts',
    'ai-concepts': 'ai-concepts',
    'ai concepts': 'ai-concepts',
    'aiconcepts': 'ai-concepts',
    'ai concept': 'ai-concepts',
    'AI Concepts': 'ai-concepts',
    'AI Concept': 'ai-concepts',
    'AICONCEPTS': 'ai-concepts',
    // Micro-lessons
    microlesson: 'micro-lessons',
    microlessons: 'micro-lessons',
    'micro-lesson': 'micro-lessons',
    'micro-lessons': 'micro-lessons',
    'micro lesson': 'micro-lessons',
    'micro lessons': 'micro-lessons',
    'Micro Lessons': 'micro-lessons',
    'Micro Lesson': 'micro-lessons',
    'MICRO LESSONS': 'micro-lessons',
    // Simulations
    simulation: 'simulations',
    simulations: 'simulations',
    'simulation': 'simulations',
    'simulations': 'simulations',
    'Simulation': 'simulations',
    'Simulations': 'simulations',
    // Recommendation
    recommendation: 'recommendation',
    recommendations: 'recommendation',
    'recommendation': 'recommendation',
    'recommendations': 'recommendation',
    'Recommendation': 'recommendation',
    'Recommendations': 'recommendation',
    // Certification
    certification: 'certifications',
    certifications: 'certifications',
    'certification': 'certifications',
    'certifications': 'certifications',
    'Certification': 'certifications',
    'Certifications': 'certifications',
    // Coach
    coach: 'ai-career-coach',
    'ai coach': 'ai-career-coach',
    'career coach': 'ai-career-coach',
    'AI Coach': 'ai-career-coach',
    'Career Coach': 'ai-career-coach',
    // Skills Forecast
    forecast: 'skills-forecast',
    'skills-forecast': 'skills-forecast',
    'skills forecast': 'skills-forecast',
    'skill forecast': 'skills-forecast',
    'Skill Forecast': 'skills-forecast',
    'Skills Forecast': 'skills-forecast',
    // Video Lessons (enhanced mapping)
    videolesson: 'video-lessons',
    videolessons: 'video-lessons',
    'video-lesson': 'video-lessons',
    'video-lessons': 'video-lessons',
    'video lesson': 'video-lessons',
    'video lessons': 'video-lessons',
    'Video Lessons': 'video-lessons',
    'Video Lesson': 'video-lessons',
    'VIDEO LESSONS': 'video-lessons',
    'VIDEO LESSON': 'video-lessons',
    'Video': 'video-lessons',
    'video': 'video-lessons',
    'VIDEO': 'video-lessons',
    // AI Study Buddy
    'ai study buddy': 'ai-study-buddy',
    'study buddy': 'ai-study-buddy',
    'ai buddy': 'ai-study-buddy',
    'chat': 'ai-study-buddy',
    'help': 'ai-study-buddy',
    'question': 'ai-study-buddy',
    'ask': 'ai-study-buddy',
    'AI Study Buddy': 'ai-study-buddy',
    'Study Buddy': 'ai-study-buddy',
    'AI Buddy': 'ai-study-buddy',
    // Babel Library
    'babel library': 'babel-library',
    'library': 'babel-library',
    'Babel Library': 'babel-library',
    'Library': 'babel-library',
    // API Config
    'api config': 'api-config',
    'API config': 'api-config',
    'API Config': 'api-config',
    'configure api': 'api-config',
    'api configuration': 'api-config',
  };

  const knownModules = ["ai-concepts", "micro-lessons", "video-lessons", "recommendation", "simulations", "ai-career-coach", "skills-forecast", "certifications", "web-search", "ai-study-buddy", "babel-library", "api-config"];

  const handleSubmit = async (value) => {
    const prompt = value || input; // || transcript;
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setStreamedOutput("");
    setNotification("");
    
    try {
      // First, try local keyword detection for common patterns
      const inputLower = prompt.toLowerCase();
      let localModule = null;
      
      // Enhanced local detection for Video Lessons
      if (inputLower.includes('video') || inputLower.includes('lección') || inputLower.includes('lesson')) {
        if (inputLower.includes('video') || inputLower.includes('lección') || inputLower.includes('lesson')) {
          localModule = 'video-lessons';
        }
      }
      
      // If we have a strong local match, use it directly
      if (localModule) {
        console.log(`🎯 Local detection: routing to ${localModule}`);
        console.log(`📞 Calling onRoute with:`, localModule, prompt);
        onRoute(localModule, prompt);
        setInput("");
        await askStream({ prompt }, (output) => setStreamedOutput(output));
        setLoading(false);
        return;
      }
      
      // Otherwise, proceed with backend routing
      console.log(`🔄 Backend routing for: "${prompt}"`);
      const res = await postRoute(prompt);
      console.log(`📡 Backend response:`, res);
      const threshold = confidenceToValue(confidenceLevel);
      const backendConfidence = confidenceToValue(res.confidence);
      const isLowConfidence = res.confidence && typeof res.confidence === 'string' && res.confidence.toLowerCase() === 'low';
      // Normalize module names for comparison (ignore case and special characters)
      const normalizedModule = (res.module || '').toLowerCase().replace(/[-_ ]/g, '');
      const normalizedKnownModules = knownModules.map(m => m.toLowerCase().replace(/[-_ ]/g, ''));
      
      console.log(`🔍 Module analysis:`, {
        normalizedModule,
        backendConfidence,
        threshold,
        isKnownModule: normalizedKnownModules.includes(normalizedModule)
      });
      
      // Check if we have a direct module match
      const isKnownModule = normalizedKnownModules.includes(normalizedModule);
      
      // Enhanced module matching using keywords
      let bestMatch = null;
      let bestScore = 0;
      
      if (!isKnownModule) {
        // Try to find the best match using keyword analysis
        const inputWords = prompt.toLowerCase().split(/\s+/);
        
        for (const module of knownModules) {
          const moduleWords = module.toLowerCase().replace(/[-_]/g, ' ').split(/\s+/);
          let score = 0;
          
          // Score based on word matches
          for (const inputWord of inputWords) {
            for (const moduleWord of moduleWords) {
              if (moduleWord.includes(inputWord) || inputWord.includes(moduleWord)) {
                score += 1;
              }
            }
          }
          
          // Bonus for exact word matches
          if (inputWords.some(word => moduleWords.includes(word))) {
            score += 2;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = module;
          }
        }
      }
      
      // Determine if we should route directly or show modal
      const shouldRouteDirectly = isKnownModule && backendConfidence >= threshold;
      const hasGoodKeywordMatch = bestMatch && bestScore >= 1;
      
      if (shouldRouteDirectly) {
        // Always log the idea
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const classifyRes = await fetch(`${API_BASE}/classify-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt })
        });
        const classifyData = await classifyRes.json();
        setUnknownIntent(classifyData);
        // Route to nearest module if possible
        if (isKnownModule) {
          setNotification(`We routed you to the closest match: ${res.module}. If this isn't what you wanted, click here to give feedback.`);
          // Use moduleMap to ensure correct mapping for App routing
          let mappedModule = moduleMap[res.module] || moduleMap[normalizedModule] || normalizedModule;
          console.log(`🎯 Backend routing: calling onRoute with:`, mappedModule, prompt);
          onRoute(mappedModule, prompt);
          setInput("");
          await askStream({ prompt }, (output) => setStreamedOutput(output));
        }
      } else if (hasGoodKeywordMatch && backendConfidence >= 1) { // Medium confidence or higher
        // Route to best keyword match with notification
        setNotification(`We found a good match: ${bestMatch}. If this isn't what you wanted, click here to give feedback.`);
        onRoute(bestMatch, prompt);
        setInput("");
        await askStream({ prompt }, (output) => setStreamedOutput(output));
      } else {
        // No known module, show modal as fallback
        setModalOpen(true);
      }
      setLoading(false);
      return;
    } catch (err) {
      console.error('Routing error:', err);
      setError("Sorry, I couldn't understand your request. Try rephrasing.");
    } finally {
      setLoading(false);
    }
  };

  const handleClarify = async () => {
    if (!clarification.trim()) return;
    setClarifying(true);
    // Combine original input and clarification for re-classification
    const combinedQuery = `${input} ${clarification}`;
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const classifyRes = await fetch(`${API_BASE}/classify-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: combinedQuery })
      });
      const classifyData = await classifyRes.json();
      setUnknownIntent(classifyData);
      setClarification("");
    } catch (err) {
      setUnknownIntent({ intent: null, module_match: null, new_feature: null, confidence: "Low", follow_up_question: "Sorry, something went wrong. Try again." });
    } finally {
      setClarifying(false);
    }
  };

  // const handleVoiceStart = () => {
  //   resetTranscript();
  //   SpeechRecognition.startListening({ continuous: false });
  // };

  // const handleVoiceStop = () => {
  //   SpeechRecognition.stopListening();
  // };

  // Helper to explain low confidence
  function getLowConfidenceReason(unknownIntent) {
    if (!unknownIntent) return null;
    if (unknownIntent.confidence && unknownIntent.confidence.toLowerCase() === 'low') {
      return (
        <div style={{ color: '#e67e22', marginTop: 12, fontSize: 15 }}>
          <b>Why wasn’t this recognized?</b>
          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
            <li>The request didn’t closely match any existing feature or module.</li>
            <li>Try rephrasing your question or being more specific.</li>
            <li>If this is a new idea, it will be logged for review and may become a future feature!</li>
          </ul>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
      {/* Confidence Bar UI */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{t('askAI.confidence.title')}:</span>
        {getConfidenceLevels(t).map(level => (
          <div
            key={level.key}
            onClick={() => setConfidenceLevel(level.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              background: confidenceLevel === level.key ? '#1976d2' : '#eee',
              color: confidenceLevel === level.key ? '#fff' : '#333',
              fontWeight: confidenceLevel === level.key ? 700 : 500,
              cursor: 'pointer',
              border: confidenceLevel === level.key ? '2px solid #1976d2' : '1px solid #ccc',
              position: 'relative',
            }}
            title={level.tooltip}
          >
            {level.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder={inputPlaceholder || "Ask AI anything..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
          disabled={loading}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading}
          style={{ padding: '0 18px', borderRadius: 6, fontSize: 16, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {loading ? t('askAI.commandBar.loading') : t('askAI.commandBar.go')}
        </button>
        {/*
        <button
          onClick={listening ? handleVoiceStop : handleVoiceStart}
          disabled={loading}
          style={{ padding: '0 12px', borderRadius: 6, fontSize: 18, background: listening ? '#28a745' : '#eee', color: listening ? '#fff' : '#333', border: 'none', cursor: 'pointer' }}
          title={listening ? 'Stop Listening' : 'Speak'}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        >
          {listening ? '🎤...' : '🎤'}
        </button>
        */}
      </div>
      {notification && (
        <div style={{ background: '#f4e2b8', color: '#8a6d1b', padding: 10, borderRadius: 6, marginBottom: 8, fontSize: 15 }}>
          {notification} <button onClick={() => setModalOpen(true)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}>Give Feedback</button>
        </div>
      )}
      {/*
      {transcript && !listening && (
        <div style={{ color: '#333', fontSize: 14, marginTop: 4 }}>
          <span>Voice input: "{transcript}"</span>
          <button onClick={() => handleSubmit(transcript)} style={{ marginLeft: 8, fontSize: 13, padding: '2px 8px', borderRadius: 4, border: '1px solid #007bff', background: '#fff', color: '#007bff', cursor: 'pointer' }}>Submit</button>
        </div>
      )}
      */}
      {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
      {streamedOutput && (
        <div style={{ marginTop: 16, background: '#f4f4f4', borderRadius: 8, padding: 16, fontFamily: 'monospace', whiteSpace: 'pre-wrap', minHeight: 40 }}>
          {streamedOutput}
        </div>
      )}
      <ModalDialog
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        title="We Didn't Recognize Your Request"
      >
        {unknownIntent ? (
          <div>
            <p><b>AI Classification:</b> {unknownIntent.intent || 'Unknown'}</p>
            <p><b>Module Match:</b> {unknownIntent.module_match || 'None'}</p>
            <p><b>Suggested Feature:</b> {unknownIntent.new_feature || 'None'}</p>
            <p><b>Confidence:</b> {unknownIntent.confidence || 'Unknown'}</p>
            {getLowConfidenceReason(unknownIntent)}
            {unknownIntent.follow_up_question && (
              <div style={{ marginTop: 12 }}>
                <p><b>Follow-up Question:</b> {unknownIntent.follow_up_question}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <input
                    type="text"
                    value={clarification}
                    onChange={e => setClarification(e.target.value)}
                    placeholder="Type your answer..."
                    style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
                    disabled={clarifying}
                  />
                  <button
                    onClick={handleClarify}
                    disabled={clarifying || !clarification.trim()}
                    style={{ background: '#1976d2', color: '#fff', border: 0, borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 15 }}
                  >
                    {clarifying ? 'Clarifying...' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setModalOpen(false)}
              style={{ marginTop: 16, background: '#007bff', color: '#fff', border: 0, borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 16 }}
            >
              Close
            </button>
            <button
              onClick={() => { setModalOpen(false); setInput(""); }}
              style={{ marginTop: 16, marginLeft: 8, background: '#eee', color: '#007bff', border: '1px solid #007bff', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 16 }}
            >
              Try Again / Rephrase
            </button>
          </div>
        ) : (
          <div>Classifying your request...</div>
        )}
      </ModalDialog>
    </div>
  );
}

export default CommandBar; 