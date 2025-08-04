import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

const Quiz = ({ quiz, onSubmit, onComplete }) => {
  const { colors } = useTheme();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (questionIndex, choice) => {
    if (!submitted) {
      setAnswers({ ...answers, [questionIndex]: choice });
    }
  };

  const calculateScore = () => {
    let correct = 0;
    let total = quiz.length;
    
    quiz.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correct++;
      }
    });
    
    return {
      correct,
      total,
      percentage: Math.round((correct / total) * 100)
    };
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < quiz.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    const scoreData = calculateScore();
    setScore(scoreData);
    setSubmitted(true);
    setShowResults(true);
    
    if (onSubmit) {
      onSubmit(answers, scoreData);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setShowResults(false);
  };

  const handleContinue = () => {
    if (onComplete) {
      onComplete(score);
    }
  };

  const getResultMessage = (percentage) => {
    if (percentage >= 80) {
      return { message: "🎉 Excellent! You've mastered this section!", color: "#4CAF50" };
    } else if (percentage >= 60) {
      return { message: "👍 Good job! You understand most concepts.", color: "#FF9800" };
    } else {
      return { message: "📚 Keep studying! Review the material and try again.", color: "#F44336" };
    }
  };

  if (showResults && score) {
    const result = getResultMessage(score.percentage);
    
    return (
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: 12, 
        padding: 24, 
        border: `1px solid ${colors.border}`,
        marginTop: 24
      }}>
        <h3 style={{ color: colors.text, marginBottom: 16 }}>Quiz Results</h3>
        
        <div style={{ 
          background: colors.primaryLight, 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2em', marginBottom: 8 }}>
            {score.percentage >= 80 ? '🎉' : score.percentage >= 60 ? '👍' : '📚'}
          </div>
          <p style={{ 
            color: colors.text, 
            fontSize: '1.1em', 
            marginBottom: 8,
            fontWeight: 600
          }}>
            {result.message}
          </p>
          <p style={{ color: colors.textSecondary }}>
            You got <strong>{score.correct}</strong> out of <strong>{score.total}</strong> questions correct.
          </p>
          <div style={{ 
            fontSize: '1.5em', 
            fontWeight: 'bold', 
            color: result.color,
            marginTop: 8
          }}>
            {score.percentage}%
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>Question Review:</h4>
          {quiz.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct_answer;
            
            return (
              <div key={index} style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: isCorrect ? '#e8f5e8' : '#ffebee',
                borderRadius: 8,
                border: `1px solid ${isCorrect ? '#4CAF50' : '#F44336'}`
              }}>
                <p style={{ 
                  color: colors.text, 
                  fontWeight: 600, 
                  marginBottom: 8 
                }}>
                  {index + 1}. {question.question}
                </p>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ 
                    color: isCorrect ? '#4CAF50' : '#F44336',
                    fontWeight: 600
                  }}>
                    Your answer: {userAnswer}) {question.options[userAnswer]}
                  </span>
                </div>
                {!isCorrect && (
                  <div>
                    <span style={{ 
                      color: '#4CAF50',
                      fontWeight: 600
                    }}>
                      Correct answer: {question.correct_answer}) {question.options[question.correct_answer]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={handleRetry}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.text,
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            🔄 Retry Quiz
          </button>
          <button
            onClick={handleContinue}
            style={{
              background: colors.primary,
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            {score.percentage >= 60 ? '✅ Continue' : '📖 Review Material'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: colors.cardBackground, 
      borderRadius: 12, 
      padding: 24, 
      border: `1px solid ${colors.border}`,
      marginTop: 24
    }}>
      <h3 style={{ color: colors.text, marginBottom: 16 }}>📝 Knowledge Check</h3>
      <p style={{ color: colors.textSecondary, marginBottom: 24 }}>
        Test your understanding of this section. Answer all questions to continue.
      </p>

      {quiz.map((question, questionIndex) => (
        <div key={questionIndex} style={{ marginBottom: 24 }}>
          <p style={{ 
            color: colors.text, 
            fontWeight: 600, 
            marginBottom: 12,
            fontSize: '1em'
          }}>
            {questionIndex + 1}. {question.question}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(question.options).map(([key, value]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: answers[questionIndex] === key ? colors.primaryLight : 'transparent',
                  border: `1px solid ${answers[questionIndex] === key ? colors.primary : colors.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (answers[questionIndex] !== key) {
                    e.target.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (answers[questionIndex] !== key) {
                    e.target.style.borderColor = colors.border;
                  }
                }}
              >
                <input
                  type="radio"
                  name={`question_${questionIndex}`}
                  value={key}
                  checked={answers[questionIndex] === key}
                  onChange={() => handleSelect(questionIndex, key)}
                  style={{ marginRight: 12 }}
                />
                <span style={{ 
                  color: answers[questionIndex] === key ? colors.primary : colors.text,
                  fontWeight: answers[questionIndex] === key ? 600 : 400
                }}>
                  {key}) {value}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTop: `1px solid ${colors.border}`
      }}>
        <span style={{ color: colors.textSecondary, fontSize: '0.9em' }}>
          {Object.keys(answers).length} of {quiz.length} questions answered
        </span>
        
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quiz.length}
          style={{
            background: Object.keys(answers).length < quiz.length ? colors.border : colors.primary,
            color: Object.keys(answers).length < quiz.length ? colors.textSecondary : 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 6,
            cursor: Object.keys(answers).length < quiz.length ? 'not-allowed' : 'pointer',
            fontSize: '0.9em',
            opacity: Object.keys(answers).length < quiz.length ? 0.6 : 1
          }}
        >
          📤 Submit Quiz
        </button>
      </div>
    </div>
  );
};

export default Quiz; 