// Scenario Simulator component skeleton
import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { askStream, saveSimulationResult } from "./api";
import StreamingProgress from "./StreamingProgress";
import StreamingText from "./StreamingText";
import { useStreaming } from "./hooks/useStreaming";
import { useTheme } from "./ThemeContext";
import { updateProgress } from "./Dashboard";
import SimulationResults from "./SimulationResults";

const SCENARIO_TYPE_KEYS = [
  { key: "customer-service", typeKey: "customerService", icon: "👥" },
  { key: "team-leadership", typeKey: "teamLeadership", icon: "👑" },
  { key: "sales-negotiation", typeKey: "salesNegotiation", icon: "💼" },
  { key: "project-management", typeKey: "projectManagement", icon: "📋" },
  { key: "conflict-resolution", typeKey: "conflictResolution", icon: "🤝" },
  { key: "presentation", typeKey: "presentation", icon: "🎤" }
];

function Simulator() {
  const { t } = useTranslation();
  const [scenarioType, setScenarioType] = useState("");
  const [customScenario, setCustomScenario] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [simulationResponse, setSimulationResponse] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  // Stable id for the current interactive run, so the "already counted" guard
  // actually dedups: completing and saving the same run share one key. Set when
  // an interactive run starts (or is loaded); cleared when the run ends.
  const runIdRef = useRef(null);
  const { colors } = useTheme();

  const simulationStatusMessages = useMemo(() => {
    const arr = t("scenarioSimulator.statusMessages", { returnObjects: true });
    return Array.isArray(arr) ? arr : [];
  }, [t]);

  const scenarioTypes = useMemo(
    () =>
      SCENARIO_TYPE_KEYS.map(({ key, typeKey, icon }) => ({
        key,
        icon,
        label: t(`scenarioSimulator.types.${typeKey}.label`),
        description: t(`scenarioSimulator.types.${typeKey}.description`)
      })),
    [t]
  );

  const stepQuestions = useMemo(() => {
    // Steps are now per scenario type; custom/unknown types fall back to a
    // neutral "generic" arc so the interactive questions match the chosen card.
    const typeKey =
      SCENARIO_TYPE_KEYS.find((s) => s.key === scenarioType)?.typeKey || "generic";
    const arr = t(`scenarioSimulator.scenarios.${typeKey}.steps`, { returnObjects: true });
    const empty = { question: "", options: { A: "", B: "", C: "", D: "" } };
    if (!Array.isArray(arr) || arr.length < 4) {
      return { 0: empty, 1: empty, 2: empty, 3: empty };
    }
    return { 0: arr[0], 1: arr[1], 2: arr[2], 3: arr[3] };
  }, [t, scenarioType]);

  const simulationStreaming = useStreaming(t("scenarioSimulator.ready"));

  const handleStartSimulation = async (type) => {
    setScenarioType(type.key);
    
    simulationStreaming.startStreaming(
      `Create an interactive scenario-based training simulation for: ${type.label}
      
      Include:
      1. A realistic workplace scenario
      2. Multiple choice responses for the user
      3. Consequences for each choice
      4. Learning points and feedback
      5. Progressive difficulty levels
      
      Make it engaging and educational.`,
      {
        statusMessages: simulationStatusMessages,
        onComplete: async (content) => {
          // Save simulation result to MongoDB
          try {
            const simulationData = {
              simulation_type: type.key,
              title: `${type.label} Simulation`,
              topic: type.label,
              description: `Interactive scenario-based training simulation for ${type.label}`,
              content: content,
              difficulty: 'intermediate',
              duration: 30,
              scenario_type: type.label,
              learning_objectives: [
                'Practice real-world decision making',
                'Learn from consequences of choices',
                'Develop critical thinking skills',
                'Improve workplace problem-solving'
              ]
            };
            
            await saveSimulationResult(simulationData);
            console.log('Simulation result saved to MongoDB');
          } catch (error) {
            console.error('Error saving simulation result:', error);
          }
        }
      }
    );
  };

  const handleStartCustomSimulation = async () => {
    if (!customScenario.trim()) {
      alert(t("scenarioSimulator.custom.alertEnterTopic"));
      return;
    }

    setScenarioType('custom');
    
    simulationStreaming.startStreaming(
      `Create an interactive scenario-based training simulation for: ${customScenario}
      
      Include:
      1. A realistic workplace scenario based on the user's topic
      2. Multiple choice responses for the user
      3. Consequences for each choice
      4. Learning points and feedback
      5. Progressive difficulty levels
      
      Make it engaging and educational.`,
      {
        statusMessages: simulationStatusMessages,
        onComplete: async (content) => {
          // Save custom simulation result to MongoDB
          try {
            const simulationData = {
              simulation_type: 'custom',
              title: `Custom Simulation: ${customScenario}`,
              topic: customScenario,
              description: `Custom interactive scenario-based training simulation for ${customScenario}`,
              content: content,
              difficulty: 'intermediate',
              duration: 30,
              scenario_type: 'Custom Scenario',
              learning_objectives: [
                'Practice real-world decision making',
                'Learn from consequences of choices',
                'Develop critical thinking skills',
                'Improve workplace problem-solving'
              ]
            };
            
            await saveSimulationResult(simulationData);
            console.log('Custom simulation result saved to MongoDB');
          } catch (error) {
            console.error('Error saving custom simulation result:', error);
          }
        }
      }
    );
  };

  const handleClear = () => {
    setScenarioType("");
    setCustomScenario("");
    setShowCustomInput(false);
    setSimulationActive(false);
    setCurrentStep(0);
    setSelectedOption(null);
    setSimulationResponse("");
    setShowOptions(false);
    setSavedProgress(null);
    runIdRef.current = null;
    simulationStreaming.clearStreaming();
  };

  const handleStartInteractiveSimulation = () => {
    setSimulationActive(true);
    setCurrentStep(0);
    setSelectedOption(null);
    setSimulationResponse("");
    setShowOptions(true);
    setSavedProgress(null);
    // One stable id per interactive run (used by the completion-dedup guard).
    runIdRef.current = `simulation_${scenarioType}_${Date.now()}`;
  };

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    setShowOptions(false);
    
    const scenarioLabel =
      scenarioType === 'custom'
        ? customScenario
        : scenarioTypes.find((st) => st.key === scenarioType)?.label;
    const currentQuestion = stepQuestions[currentStep];
    const optionText = currentQuestion.options[option];

    const promptText = `In a "${scenarioLabel}" workplace training simulation, the situation is: "${currentQuestion.question}"
The user chose Option ${option}: "${optionText}".
Provide a detailed, realistic response including:
1. Immediate consequences of this choice
2. Longer-term implications for the situation
3. What the user should do next
4. Key learning points

Keep it educational and specific to this scenario (step ${currentStep + 1}).`;
    
    try {
      const response = await askStream({ prompt: promptText });
      setSimulationResponse(response);
    } catch (error) {
      // Offline fallback: the LLM call failed. Show the localized generic
      // response instead of the old hardcoded English, project-management-
      // themed consequences (removed in 1.30.4 — they were shown for every
      // scenario type regardless of the choice).
      setSimulationResponse(
        t("scenarioSimulator.actions.genericFallback", { option, step: currentStep + 1 })
      );
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setSimulationResponse("");
      setShowOptions(true);
    } else {
      // Simulation completed
      setSimulationActive(false);
      
      // Check if this simulation was already counted. Use the stable per-run id
      // so completing and saving the same run don't both increment the counter.
      const simulationKey = runIdRef.current || `simulation_${scenarioType}_${Date.now()}`;
      const completedSimulations = JSON.parse(localStorage.getItem('completedSimulations') || '[]');

      if (!completedSimulations.includes(simulationKey)) {
        // Update Dashboard progress only if not already counted
        updateProgress({
          simulationsCompleted: 1,
          simulationScore: 1
        });
        
        // Mark this simulation as completed
        completedSimulations.push(simulationKey);
        localStorage.setItem('completedSimulations', JSON.stringify(completedSimulations));
      }
      
      alert(t("scenarioSimulator.alerts.congratulationsComplete"));
    }
  };

  const handleSaveProgress = () => {
    const progress = {
      scenarioType: scenarioType,
      customScenario: customScenario,
      currentStep: currentStep,
      selectedOption: selectedOption,
      simulationResponse: simulationResponse,
      timestamp: new Date().toISOString(),
      completed: currentStep >= 3
    };
    
    setSavedProgress(progress);
    
    // Save to localStorage
    const savedSimulations = JSON.parse(localStorage.getItem('simulationProgress') || '[]');
    savedSimulations.push(progress);
    localStorage.setItem('simulationProgress', JSON.stringify(savedSimulations));
    
    // If simulation is completed, update Dashboard progress
    if (currentStep >= 3) {
      const simulationKey = runIdRef.current || `simulation_${scenarioType}_${Date.now()}`;
      const completedSimulations = JSON.parse(localStorage.getItem('completedSimulations') || '[]');

      if (!completedSimulations.includes(simulationKey)) {
        updateProgress({
          simulationsCompleted: 1,
          simulationScore: 1
        });
        
        completedSimulations.push(simulationKey);
        localStorage.setItem('completedSimulations', JSON.stringify(completedSimulations));
      }
    }
    
    alert(t("scenarioSimulator.alerts.progressSaved"));
  };

  const handleLoadProgress = () => {
    const savedSimulations = JSON.parse(localStorage.getItem('simulationProgress') || '[]');
    if (savedSimulations.length > 0) {
      const latestProgress = savedSimulations[savedSimulations.length - 1];
      setSavedProgress(latestProgress);
      setCurrentStep(latestProgress.currentStep);
      setSelectedOption(latestProgress.selectedOption);
      setSimulationResponse(latestProgress.simulationResponse);
      setSimulationActive(true);
      setShowOptions(!latestProgress.selectedOption);
      // Fresh run id for the loaded session so its completion counts once.
      runIdRef.current = `simulation_${latestProgress.scenarioType || scenarioType}_${Date.now()}`;
      alert(t("scenarioSimulator.alerts.progressLoaded"));
    } else {
      alert(t("scenarioSimulator.alerts.noSavedProgress"));
    }
  };

  const handleEndSimulation = () => {
    setSimulationActive(false);
    setCurrentStep(0);
    setSelectedOption(null);
    setSimulationResponse("");
    setShowOptions(false);
    setSavedProgress(null);
    runIdRef.current = null;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🎮 {t("scenarioSimulator.pageTitle")}</h2>

      <p style={{ marginBottom: 20, color: colors.textSecondary }}>
        {t("scenarioSimulator.intro")}
      </p>

      {/* Scenario Type Selection */}
      {!scenarioType && !simulationStreaming.content && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {scenarioTypes.map((type) => (
              <div
                key={type.key}
                onClick={() => handleStartSimulation(type)}
                style={{
                  padding: 20,
                  background: colors.cardBackground,
                  borderRadius: 12,
                  border: `2px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
              >
                <div style={{ fontSize: '2.5em', marginBottom: 12 }}>
                  {type.icon}
                </div>
                <h3 style={{ marginBottom: 8, color: colors.text }}>
                  {type.label}
                </h3>
                <p style={{ 
                  color: colors.textSecondary, 
                  fontSize: '0.9em',
                  lineHeight: 1.4,
                  marginBottom: 12
                }}>
                  {type.description}
                </p>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: colors.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                >
                  {t("scenarioSimulator.startSimulation")}
                </button>
              </div>
            ))}

            {/* Custom Scenario Card */}
            <div
              style={{
                padding: 20,
                background: colors.cardBackground,
                borderRadius: 12,
                border: `2px solid ${colors.border}`,
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '2.5em', marginBottom: 12 }}>
                ✨
              </div>
              <h3 style={{ marginBottom: 8, color: colors.text }}>
                {t("scenarioSimulator.custom.title")}
              </h3>
              <p style={{ 
                color: colors.textSecondary, 
                fontSize: '0.9em',
                lineHeight: 1.4,
                marginBottom: 12
              }}>
                {t("scenarioSimulator.custom.description")}
              </p>
              
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: colors.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                >
                  {t("scenarioSimulator.custom.startCustom")}
                </button>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <input
                    type="text"
                    value={customScenario}
                    onChange={(e) => setCustomScenario(e.target.value)}
                    placeholder={t("scenarioSimulator.custom.placeholder")}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.text,
                      fontSize: '0.9em',
                      marginBottom: 8
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStartCustomSimulation();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleStartCustomSimulation}
                      disabled={!customScenario.trim()}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: customScenario.trim() ? colors.primary : colors.border,
                        color: '#fff',
                        cursor: customScenario.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '0.9em',
                        flex: 1
                      }}
                    >
                      {t("scenarioSimulator.startSimulation")}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomScenario("");
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.cardBackground,
                        color: colors.text,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {t("scenarioSimulator.custom.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulation Session */}
      {scenarioType && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            padding: 12,
            background: colors.primaryLight,
            borderRadius: 8
          }}>
            <span style={{ fontSize: '1.5em' }}>
              {scenarioType === 'custom' ? '✨' : scenarioTypes.find(st => st.key === scenarioType)?.icon}
            </span>
            <div>
              <h3 style={{ margin: 0, color: colors.text }}>
                {t("scenarioSimulator.session.simulationTitle", { name: scenarioType === 'custom' ? customScenario : scenarioTypes.find(st => st.key === scenarioType)?.label })}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
                {t("scenarioSimulator.session.subtitle")}
              </p>
            </div>
          </div>

          {/* Simulation Progress */}
          {simulationStreaming.loading && (
            <StreamingProgress 
              loading={simulationStreaming.loading}
              status={simulationStreaming.status}
              progress={simulationStreaming.progress}
              color="success"
            />
          )}

          {/* Simulation Content */}
          <StreamingText 
            content={simulationStreaming.content}
            loading={simulationStreaming.loading}
            placeholder={t("scenarioSimulator.creatingPlaceholder")}
            style={{ minHeight: '300px' }}
          />

          {/* Action Buttons */}
          {simulationStreaming.isComplete && (
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleStartInteractiveSimulation}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.primary,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                🎮 {t("scenarioSimulator.startSimulation")}
              </button>
              <button
                onClick={handleSaveProgress}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📋 {t("scenarioSimulator.actions.saveProgress")}
              </button>
              <button
                onClick={handleLoadProgress}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📂 {t("scenarioSimulator.actions.loadProgress")}
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                🔄 {t("scenarioSimulator.actions.newScenario")}
              </button>
            </div>
          )}

          {/* Interactive Simulation Interface */}
          {simulationActive && simulationStreaming.isComplete && (
            <div style={{
              marginTop: 20,
              padding: 20,
              background: colors.cardBackground,
              borderRadius: 12,
              border: `2px solid ${colors.primary}`,
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 16 }}>
                🎯 {t("scenarioSimulator.actions.interactiveActive")}
              </h4>
              
              {/* Step Indicator */}
              <div style={{
                padding: 8,
                background: colors.primaryLight,
                borderRadius: 6,
                marginBottom: 16,
                textAlign: 'center'
              }}>
                <span style={{ color: colors.text, fontWeight: 'bold' }}>
                  {t("scenarioSimulator.actions.stepOf", { current: currentStep + 1, total: 4 })}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: colors.border,
                borderRadius: '4px',
                marginBottom: 16,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((currentStep + 1) / 4) * 100}%`,
                  height: '100%',
                  background: colors.primary,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Options Selection */}
              {showOptions && (
                <div style={{ marginBottom: 20 }}>
                  <h5 style={{ color: colors.text, marginBottom: 12 }}>
                    {stepQuestions[currentStep]?.question}
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: `2px solid ${colors.border}`,
                          background: colors.background,
                          color: colors.text,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.9em',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
                      >
                        <strong style={{ marginRight: 8 }}>{option})</strong>
                        {stepQuestions[currentStep]?.options[option] || t("scenarioSimulator.actions.optionNotDefined")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Option and Response */}
              {selectedOption && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    padding: 12,
                    background: colors.primaryLight,
                    borderRadius: 8,
                    marginBottom: 12
                  }}>
                    <strong style={{ color: colors.text }}>{t("scenarioSimulator.actions.yourChoice")}</strong>
                    <span style={{ color: colors.textSecondary, marginLeft: 8 }}>
                      {t("scenarioSimulator.actions.choiceDetail", { option: selectedOption, step: currentStep + 1 })}
                    </span>
                  </div>
                  
                  {simulationResponse && (
                    <div style={{
                      padding: 16,
                      background: colors.background,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      marginBottom: 16
                    }}>
                      <h6 style={{ color: colors.text, marginTop: 0, marginBottom: 8 }}>
                        {t("scenarioSimulator.actions.systemResponse")}
                      </h6>
                      <div style={{
                        color: colors.textSecondary,
                        fontSize: '0.9em',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {simulationResponse}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleNextStep}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: colors.primary,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {currentStep < 3 ? t("scenarioSimulator.actions.continueNext") : t("scenarioSimulator.actions.completeSimulation")}
                    </button>
                    <button
                      onClick={handleSaveProgress}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.cardBackground,
                        color: colors.text,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {t("scenarioSimulator.actions.saveProgress")}
                    </button>
                    <button
                      onClick={handleEndSimulation}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.cardBackground,
                        color: colors.text,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {t("scenarioSimulator.actions.endSimulation")}
                    </button>
                  </div>
                </div>
              )}

              {/* Status when no option selected */}
              {!selectedOption && showOptions && (
                <div style={{
                  padding: 12,
                  background: colors.primaryLight,
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <strong style={{ color: colors.text }}>{t("scenarioSimulator.actions.statusLabel")}</strong>
                  <span style={{ color: colors.textSecondary, marginLeft: 8 }}>
                    {t("scenarioSimulator.actions.selectOptionHint", { step: currentStep + 1 })}
                  </span>
                </div>
              )}

              {/* Saved Progress Indicator */}
              {savedProgress && (
                <div style={{
                  padding: 8,
                  background: '#e8f5e8',
                  borderRadius: 6,
                  marginTop: 12,
                  textAlign: 'center'
                }}>
                  <span style={{ color: '#2e7d32', fontSize: '0.9em' }}>
                    ✅ {t("scenarioSimulator.actions.progressSavedAt", { time: new Date(savedProgress.timestamp).toLocaleTimeString() })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Handling */}
          {simulationStreaming.error && (
            <div style={{ 
              padding: 16, 
              background: '#ffebee', 
              color: '#c62828',
              borderRadius: 8,
              marginBottom: 16
            }}>
              <strong>{t("scenarioSimulator.actions.errorPrefix")}</strong> {simulationStreaming.error}
              <button
                onClick={handleClear}
                style={{
                  marginLeft: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#c62828',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8em'
                }}
              >
                {t("scenarioSimulator.actions.tryAgain")}
              </button>
            </div>
          )}
        </div>
      )}

             {/* Simulation Results Section */}
       <div style={{ marginTop: '3rem', borderTop: `2px solid ${colors.border}`, paddingTop: '2rem' }}>
         <SimulationResults user={null} />
       </div>
    </div>
  );
}

export default Simulator; 