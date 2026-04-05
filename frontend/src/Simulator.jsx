// Scenario Simulator component skeleton
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { askStream, saveSimulationResult } from "./api";
import StreamingProgress from "./StreamingProgress";
import StreamingText from "./StreamingText";
import { useStreaming } from "./hooks/useStreaming";
import { useTheme } from "./ThemeContext";
import { updateProgress, getCurrentProgress } from "./Dashboard";
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
    const arr = t("scenarioSimulator.steps", { returnObjects: true });
    if (!Array.isArray(arr) || arr.length < 4) {
      const empty = { question: "", options: { A: "", B: "", C: "", D: "" } };
      return { 0: empty, 1: empty, 2: empty, 3: empty };
    }
    return { 0: arr[0], 1: arr[1], 2: arr[2], 3: arr[3] };
  }, [t]);

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
    simulationStreaming.clearStreaming();
  };

  const handleStartInteractiveSimulation = () => {
    setSimulationActive(true);
    setCurrentStep(0);
    setSelectedOption(null);
    setSimulationResponse("");
    setShowOptions(true);
    setSavedProgress(null);
    console.log('Starting interactive simulation...');
  };

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    setShowOptions(false);
    
    const currentQuestion = stepQuestions[currentStep];
    const optionText = currentQuestion.options[option];
    
    const promptText = `Based on the user's choice of Option ${option}: "${optionText}" in step ${currentStep + 1}, provide a detailed response including:
1. Immediate consequences of this action
2. Long-term implications for the project
3. What the user should do next
4. Learning points from this decision

Make it educational and realistic for step ${currentStep + 1} of the simulation.`;
    
    try {
      const response = await askStream({ prompt: promptText });
      setSimulationResponse(response);
    } catch (error) {
      // Fallback responses for each step
      const fallbackResponses = {
        0: {
          'A': `Step 1 - Option A: Ignore the issue and hope the team can catch up.

Immediate consequences: The issue may escalate as the team struggles without support, leading to missed deadlines and increased stress.

Long-term implications: This approach can damage team morale and trust in leadership, potentially causing higher turnover rates.

What to do next: Schedule a team meeting to address the challenges and provide necessary resources and support.

Learning points: Proactive communication and support are essential for maintaining team productivity and morale. Ignoring problems rarely leads to positive outcomes.`,
          'B': `Step 1 - Option B: Inform the stakeholders about the delay.

Immediate consequences: Stakeholders are aware of the situation and can adjust their expectations and plans accordingly.

Long-term implications: This builds trust and transparency with stakeholders, potentially leading to better collaboration and support in future projects.

What to do next: Work with the team to create a revised timeline and identify areas where additional resources might help.

Learning points: Transparency and proactive communication with stakeholders is crucial for maintaining professional relationships and managing expectations effectively.`,
          'C': `Step 1 - Option C: Reassign the work to a different team.

Immediate consequences: The new team may need time to understand the project context, potentially causing further delays initially.

Long-term implications: This could strain relationships between teams and may not address the root cause of the original team's challenges.

What to do next: Ensure proper knowledge transfer and provide the new team with all necessary documentation and context.

Learning points: Before reassigning work, it's important to understand why the original team is struggling and whether additional support might be more effective than reassignment.`,
          'D': `Step 1 - Option D: Pressure the team to work overtime.

Immediate consequences: The team may deliver rushed, flawed work due to stress and fatigue, potentially creating more problems.

Long-term implications: This approach can lead to burnout, decreased morale, and higher turnover rates, damaging team productivity in the long run.

What to do next: Instead of pressuring for overtime, focus on identifying and removing obstacles that are slowing the team down.

Learning points: Sustainable productivity comes from addressing root causes rather than pushing teams beyond their limits. Quality often suffers when teams are overworked.`
        },
        1: {
          'A': `Step 2 - Option A: Schedule a team meeting to discuss the situation openly.

Immediate consequences: Team members feel heard and involved in the decision-making process, leading to better buy-in and collaboration.

Long-term implications: This builds a culture of transparency and trust, improving team dynamics and future project success.

What to do next: Prepare an agenda and gather feedback from team members before the meeting.

Learning points: Open communication and team involvement are key to successful project management and team morale.`,
          'B': `Step 2 - Option B: Send an email update and wait for responses.

Immediate consequences: Information is disseminated quickly but may lack personal touch and immediate feedback.

Long-term implications: This approach may create distance between leadership and team, potentially affecting future communication.

What to do next: Follow up with individual team members who haven't responded and schedule one-on-one meetings if needed.

Learning points: While email is efficient, personal interaction is often more effective for complex or sensitive situations.`,
          'C': `Step 2 - Option C: Meet with team leaders individually.

Immediate consequences: You get detailed insights from key team members and can address specific concerns privately.

Long-term implications: This builds strong relationships with team leaders and creates a support network for future challenges.

What to do next: Compile feedback from all leaders and create a comprehensive action plan to address common concerns.

Learning points: Individual meetings allow for deeper discussions and can reveal issues that might not surface in group settings.`,
          'D': `Step 2 - Option D: Let the team figure it out on their own.

Immediate consequences: Team members may feel abandoned and uncertain about expectations and support.

Long-term implications: This can create a culture of self-preservation rather than collaboration, damaging team cohesion.

What to do next: Reconsider this approach and provide clear guidance and support to the team.

Learning points: While autonomy is important, teams need clear direction and support, especially during challenging times.`
        },
        2: {
          'A': `Step 3 - Option A: Provide detailed weekly progress reports.

Immediate consequences: Stakeholders receive comprehensive updates and can make informed decisions about their own timelines.

Long-term implications: This establishes a reputation for transparency and reliability, strengthening business relationships.

What to do next: Create a standardized reporting template and schedule regular update meetings.

Learning points: Consistent, detailed communication builds trust and helps stakeholders manage their own expectations effectively.`,
          'B': `Step 3 - Option B: Set up a crisis management meeting.

Immediate consequences: All stakeholders are immediately engaged and can contribute to problem-solving efforts.

Long-term implications: This demonstrates proactive leadership and can strengthen stakeholder relationships through collaborative problem-solving.

What to do next: Prepare a clear agenda and gather all relevant data before the meeting to ensure productive discussion.

Learning points: Crisis management meetings can be effective but require careful preparation to avoid creating unnecessary panic.`,
          'C': `Step 3 - Option C: Create a revised project timeline with milestones.

Immediate consequences: Stakeholders have clear expectations about new deadlines and can adjust their own plans accordingly.

Long-term implications: This shows professional project management skills and builds confidence in your ability to handle challenges.

What to do next: Present the timeline to stakeholders and get their buy-in on the new milestones.

Learning points: Clear, realistic timelines with specific milestones help manage expectations and provide a roadmap for recovery.`,
          'D': `Step 3 - Option D: Minimize communication to avoid panic.

Immediate consequences: Stakeholders may become suspicious and lose trust due to lack of information.

Long-term implications: This approach can damage relationships and make future communication more difficult.

What to do next: Reconsider this strategy and provide honest, timely updates to maintain trust.

Learning points: While avoiding panic is important, transparency and regular communication are essential for maintaining stakeholder trust.`
        },
        3: {
          'A': `Step 4 - Option A: Implement new project management processes.

Immediate consequences: The team has clear guidelines and tools to prevent similar issues in future projects.

Long-term implications: This creates a more efficient and predictable project delivery system, improving overall organizational performance.

What to do next: Train the team on new processes and gather feedback to ensure they're practical and effective.

Learning points: Continuous improvement in processes is essential for organizational growth and preventing recurring problems.`,
          'B': `Step 4 - Option B: Conduct a post-mortem analysis with the team.

Immediate consequences: Team members gain insights into what went wrong and can contribute to solutions.

Long-term implications: This creates a learning culture where mistakes are viewed as opportunities for improvement.

What to do next: Document findings and create action items to address identified issues.

Learning points: Post-mortem analyses are valuable tools for organizational learning and preventing similar issues in the future.`,
          'C': `Step 4 - Option C: Hire additional resources for the project.

Immediate consequences: The team gets additional support, potentially improving current project outcomes.

Long-term implications: This may address immediate needs but doesn't solve underlying process or communication issues.

What to do next: Ensure new team members are properly onboarded and integrated into existing processes.

Learning points: While additional resources can help, they should be part of a broader strategy that addresses root causes of problems.`,
          'D': `Step 4 - Option D: Move on and focus on the next project.

Immediate consequences: The team can start fresh without dwelling on past issues.

Long-term implications: This approach may lead to repeated problems if underlying issues aren't addressed.

What to do next: Consider whether this approach truly serves the team and organization's long-term interests.

Learning points: While moving forward is important, learning from past experiences is crucial for continuous improvement and preventing recurring issues.`
        }
      };
      
      const stepResponses = fallbackResponses[currentStep] || fallbackResponses[0];
      setSimulationResponse(
        stepResponses[option] ||
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
      
      // Check if this simulation was already counted
      const currentProgress = getCurrentProgress();
      const simulationKey = `simulation_${scenarioType}_${Date.now()}`;
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
      const currentProgress = getCurrentProgress();
      const simulationKey = `simulation_${scenarioType}_${Date.now()}`;
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
                onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
                onMouseLeave={(e) => e.target.style.borderColor = colors.border}
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
                    onKeyPress={(e) => {
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
              {scenarioType === 'custom' ? '✨' : scenarioTypes.find(t => t.key === scenarioType)?.icon}
            </span>
            <div>
              <h3 style={{ margin: 0, color: colors.text }}>
                {scenarioType === 'custom' ? `${customScenario} Simulation` : `${scenarioTypes.find(t => t.key === scenarioType)?.label} Simulation`}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
                Interactive Training Scenario
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
            placeholder="Creating your interactive simulation..."
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
                🎮 Start Simulation
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
                📋 Save Progress
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
                📂 Load Progress
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
                🔄 New Scenario
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
                🎯 Interactive Simulation Active
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
                  Step {currentStep + 1} of 4
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
                    {stepQuestions[currentStep]?.question || "What is your immediate course of action?"}
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
                        onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
                        onMouseLeave={(e) => e.target.style.borderColor = colors.border}
                      >
                        <strong style={{ marginRight: 8 }}>{option})</strong>
                        {stepQuestions[currentStep]?.options[option] || 'Option not defined'}
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
                    <strong style={{ color: colors.text }}>Your Choice:</strong>
                    <span style={{ color: colors.textSecondary, marginLeft: 8 }}>
                      Option {selectedOption} - Step {currentStep + 1}
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
                        System Response:
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
                      {currentStep < 3 ? 'Continue to Next Step' : 'Complete Simulation'}
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
                      Save Progress
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
                      End Simulation
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
                  <strong style={{ color: colors.text }}>Status:</strong> 
                  <span style={{ color: colors.textSecondary, marginLeft: 8 }}>
                    Please select an option to continue to Step {currentStep + 1}
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
                    ✅ Progress saved at {new Date(savedProgress.timestamp).toLocaleTimeString()}
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
              <strong>Error:</strong> {simulationStreaming.error}
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
                Try Again
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