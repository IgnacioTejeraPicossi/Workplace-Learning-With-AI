import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { fetchSimulationResults, deleteSimulationResult, updateSimulationResult } from './api';

function SimulationResults({ user }) {
  const [simulationResults, setSimulationResults] = useState([]);
  const [filter, setFilter] = useState('');
  const [expandedResult, setExpandedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoExpandTarget, setAutoExpandTarget] = useState(null);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false); // NEW: Prevent multiple auto-expansions
  const { colors } = useTheme();

  // Load simulation results from API
  const loadSimulationResults = async () => {
    setLoading(true);
    try {
      const data = await fetchSimulationResults();
      setSimulationResults(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSimulationResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always load simulation results for this component
    loadSimulationResults();
    
    // CRITICAL: Ensure no simulations are expanded initially
    setExpandedResult(null);
    setHasAutoExpanded(false); // Reset auto-expansion flag
    console.log(`🧹 [Simulations] Component mounted - cleared expandedResult state and reset auto-expansion flag`);
  }, []);

  // Navigation intelligence from Babel Library
  useEffect(() => {
    // Check for navigation instructions from Babel Library
    const checkNavigationInstructions = () => {
      const targetPage = localStorage.getItem('targetPage');
      const action = localStorage.getItem('action');
      const resourceId = localStorage.getItem('editResourceId');
      const resourceTitle = localStorage.getItem('editResourceTitle');
      const autoExpand = localStorage.getItem('autoExpand');
      
      console.log(`🔍 [Simulations] Checking for navigation instructions:`, {
        targetPage,
        action,
        resourceId,
        resourceTitle,
        autoExpand
      });
      
      if (targetPage && action && resourceId) {
        console.log(`🎯 [Simulations] Navigation instructions found:`, {
          targetPage,
          action,
          resourceId,
          resourceTitle,
          autoExpand
        });
        
        // If autoExpand is enabled, find and expand the specific simulation
        if (autoExpand === 'true' && resourceTitle) {
          console.log(`🎯 [Simulations] Setting autoExpandTarget:`, { id: resourceId, title: resourceTitle });
          // Set a flag to auto-expand after simulations are loaded
          setAutoExpandTarget({ id: resourceId, title: resourceTitle });
        }
        
        // Clear the navigation instructions from localStorage
        localStorage.removeItem('targetPage');
        localStorage.removeItem('editResourceId');
        localStorage.removeItem('editResourceTitle');
        localStorage.removeItem('autoExpand');
        
        console.log(`🧹 [Simulations] Navigation instructions cleared from localStorage`);
      } else {
        console.log(`ℹ️ [Simulations] No navigation instructions found in localStorage`);
      }
    };
    
    // Check for navigation instructions after a short delay to ensure component is fully loaded
    const timer = setTimeout(checkNavigationInstructions, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Additional check for navigation instructions when component mounts
  useEffect(() => {
    const checkOnMount = () => {
      const resourceTitle = localStorage.getItem('editResourceTitle');
      const autoExpand = localStorage.getItem('autoExpand');
      
      if (autoExpand === 'true' && resourceTitle) {
        console.log(`🎯 [Simulations] Found navigation instructions on mount:`, { resourceTitle, autoExpand });
        setAutoExpandTarget({ id: 'mount', title: resourceTitle });
      }
    };
    
    const timer = setTimeout(checkOnMount, 200);
    return () => clearTimeout(timer);
  }, []);

    // Auto-expand specific simulation when results are loaded
  useEffect(() => {
    console.log(`🔍 [Simulations] Auto-expand useEffect triggered:`, {
      autoExpandTarget,
      simulationResultsLength: simulationResults.length,
      hasAutoExpanded,
      simulationResults: simulationResults.map(s => ({ id: s.id, title: s.title }))
    });
    
    if (autoExpandTarget && simulationResults.length > 0 && !hasAutoExpanded) {
      console.log(`🔍 [Simulations] Looking for simulation to auto-expand:`, autoExpandTarget);
      console.log(`🔍 [Simulations] Available simulations:`, simulationResults.map(s => ({ id: s.id, title: s.title })));
      
      // Find the simulation by title (more reliable than ID)
      const targetSimulation = simulationResults.find(result => {
        // Clean titles for comparison (remove extra spaces, special chars)
        const cleanResultTitle = result.title.toLowerCase().replace(/\s+/g, ' ').trim();
        const cleanTargetTitle = autoExpandTarget.title.toLowerCase().replace(/\s+/g, ' ').trim();
        
        console.log(`🔍 [Simulations] Original titles:`, {
          result: result.title,
          target: autoExpandTarget.title
        });
        
        console.log(`🔍 [Simulations] Cleaned titles:`, {
          result: cleanResultTitle,
          target: cleanTargetTitle
        });
        
        // SUPER FLEXIBLE matching for debugging
        const exactMatch = cleanResultTitle === cleanTargetTitle;
        const resultIncludesTarget = cleanResultTitle.includes(cleanTargetTitle);
        const targetIncludesResult = cleanTargetTitle.includes(cleanResultTitle);
        
        // Additional flexible matching
        const resultWords = cleanResultTitle.split(' ').filter(word => word.length > 2);
        const targetWords = cleanTargetTitle.split(' ').filter(word => word.length > 2);
        const wordMatch = resultWords.some(word => targetWords.includes(word)) ||
                         targetWords.some(word => resultWords.includes(word));
        
        console.log(`🔍 [Simulations] Match results:`, {
          exactMatch,
          resultIncludesTarget,
          targetIncludesResult,
          wordMatch,
          resultWords,
          targetWords
        });
        
        return exactMatch || resultIncludesTarget || targetIncludesResult || wordMatch;
      });
      
             if (targetSimulation) {
         console.log(`✅ [Simulations] Found simulation to expand:`, targetSimulation);
         
         // SIMPLE FIX: Use array index for unique identification
         const simulationIndex = simulationResults.findIndex(result => result.title === targetSimulation.title);
         const uniqueIdentifier = `index-${simulationIndex}`;
         
         console.log(`🔧 [Simulations] Using unique identifier:`, uniqueIdentifier, `for simulation at index:`, simulationIndex);
         
         // Expand the simulation
         setExpandedResult(uniqueIdentifier);
         
         console.log(`✅ [Simulations] Automatically expanded: "${targetSimulation.title}" with identifier: ${uniqueIdentifier}`);
         
                   // Scroll to the simulation
          setTimeout(() => {
            const simulationElement = document.querySelector(`[data-simulation-id="${targetSimulation.id}"]`);
            if (simulationElement) {
              console.log(`🎯 [Simulations] Scrolling to element:`, simulationElement);
              simulationElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            } else {
              console.warn(`⚠️ [Simulations] Element not found for ID: ${targetSimulation.id}`);
            }
          }, 300);
         
         // Mark as completed
         setAutoExpandTarget(null);
         setHasAutoExpanded(true);
       } else {
        console.warn(`⚠️ [Simulations] No simulation found matching title: "${autoExpandTarget.title}"`);
        console.warn(`⚠️ [Simulations] Available titles:`, simulationResults.map(s => s.title));
        
        // Try to find by partial match - but be more specific
        const partialMatch = simulationResults.find(result => {
          const resultTitle = result.title.toLowerCase();
          const targetTitle = autoExpandTarget.title.toLowerCase();
          
          // Look for exact word matches
          const targetWords = targetTitle.split(' ').filter(word => word.length > 2);
          const resultWords = resultTitle.split(' ').filter(word => word.length > 2);
          
          return targetWords.some(word => resultWords.includes(word)) ||
                 resultWords.some(word => targetWords.includes(word));
        });
        
                 if (partialMatch) {
           console.log(`🎯 [Simulations] Found partial match:`, partialMatch);
           setExpandedResult(partialMatch.id);
           setAutoExpandTarget(null);
           setHasAutoExpanded(true); // PREVENT future auto-expansions
         }
      }
    }
  }, [simulationResults, hasAutoExpanded]); // Added hasAutoExpanded dependency

  const filteredResults = simulationResults.filter(result =>
    result.title.toLowerCase().includes(filter.toLowerCase()) ||
    result.topic.toLowerCase().includes(filter.toLowerCase()) ||
    result.simulation_type.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDelete = async (resultId) => {
    if (!window.confirm("Delete this simulation result?")) return;
    
    console.log(`🗑️ [Simulations] Attempting to delete simulation with ID:`, resultId);
    
    try {
      const result = await deleteSimulationResult(resultId);
      console.log(`✅ [Simulations] Delete successful:`, result);
      
      // Remove from local state immediately for better UX
      setSimulationResults(prev => prev.filter(result => result.id !== resultId));
      
      // Reload from server to ensure consistency
      await loadSimulationResults();
      
      console.log(`🔄 [Simulations] Simulation results reloaded after deletion`);
    } catch (err) {
      console.error(`❌ [Simulations] Delete failed:`, err);
      alert(`Failed to delete simulation: ${err.message}`);
    }
  };

  const toggleExpand = (resultId) => {
    console.log(`🔄 [Simulations] Toggle expand called for ID: ${resultId}, current expanded: ${expandedResult}`);
    
    // Find the simulation index for unique identification
    const simulationIndex = simulationResults.findIndex(result => result.id === resultId);
    const uniqueIdentifier = simulationIndex >= 0 ? `index-${simulationIndex}` : resultId;
    
    console.log(`🔧 [Simulations] Toggle using unique identifier:`, uniqueIdentifier, `for simulation at index:`, simulationIndex);
    
    // Ensure only one simulation is expanded at a time
    if (expandedResult === resultId || expandedResult === uniqueIdentifier) {
      // Collapse if already expanded
      console.log(`📁 [Simulations] Collapsing simulation: ${resultId}`);
      setExpandedResult(null);
    } else {
      // Expand this one, collapse others
      console.log(`📂 [Simulations] Expanding simulation: ${resultId} with identifier: ${uniqueIdentifier}`);
      setExpandedResult(uniqueIdentifier);
    }
  };

  if (loading) return <div>Loading simulation results...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', color: colors.text }}>Simulation Results</h2>
      
      {/* Navigation status message */}
      {autoExpandTarget && (
        <div style={{ 
          background: colors.primaryLight, 
          color: colors.primary, 
          padding: "12px 16px", 
          borderRadius: 8, 
          marginBottom: 16,
          border: `1px solid ${colors.primary}`,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎯 <strong>Navigating to:</strong> "{autoExpandTarget.title}" - Expanding automatically...
        </div>
      )}
      
      {/* Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter by title, topic, or type..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            flex: 1,
            maxWidth: '300px'
          }}
        />
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {filteredResults.map((result, index) => (
           <div
             key={result.id ? result.id.toString() : `simulation-${index}`}
             data-simulation-id={result.id}
             style={{
               background: colors.cardBackground,
               border: `1px solid ${colors.border}`,
               borderRadius: '8px',
               padding: '1rem',
               boxShadow: colors.shadow
             }}
           >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto',
              gap: '1rem',
              alignItems: 'start',
              width: '100%'
            }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>
                  🎮 {result.title}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                  Type: {result.simulation_type} | Topic: {result.topic} | Duration: {result.duration} min
                </p>
                <p style={{ margin: '0 0 0.5rem 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                  Difficulty: {result.difficulty} | Created: {new Date(result.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                                                  <button
                   onClick={() => toggleExpand(result.id)}
                   style={{
                     padding: '0.5rem 1rem',
                     background: 'transparent',
                     border: `1px solid ${colors.border}`,
                     borderRadius: '4px',
                     cursor: 'pointer',
                     fontSize: '0.8rem'
                   }}
                 >
                   {expandedResult === result.id || expandedResult === `index-${index}` ? '📁 Compress' : '📂 Expand'}
                 </button>
                 
                 <button
                   onClick={() => handleDelete(result.id)}
                   style={{
                     padding: '0.5rem 1rem',
                     background: '#dc3545',
                     color: 'white',
                     border: 'none',
                     borderRadius: '4px',
                     cursor: 'pointer',
                     fontSize: '0.8rem'
                   }}
                 >
                   🗑️ Delete
                 </button>
              </div>
            </div>
            
                         {/* Expanded content */}
             {(expandedResult === result.id || expandedResult === `index-${index}`) && (
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                background: colors.cardBackground,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                width: '100%'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: colors.textSecondary }}>Description:</strong>
                  <p style={{ color: colors.text, margin: '0.5rem 0', lineHeight: 1.5 }}>
                    {result.description}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: colors.textSecondary }}>Content:</strong>
                  <div style={{ 
                    color: colors.text, 
                    margin: '0.5rem 0', 
                    lineHeight: 1.6,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '1rem',
                    background: colors.background,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`
                  }}>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'inherit',
                      margin: 0
                    }}>
                      {result.content}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: colors.textSecondary }}>
          {filter ? 'No simulation results match your filter.' : 'No simulation results yet.'}
        </div>
      )}
    </div>
  );
}

export default SimulationResults;
