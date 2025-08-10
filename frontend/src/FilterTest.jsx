import React, { useState } from 'react';

const FilterTest = () => {
  const [selectedMasteryLevel, setSelectedMasteryLevel] = useState('all');
  
  // Mock data similar to the real application
  const mockTopics = {
    "prompt_engineering": { label: "Prompt Engineering", mastery: 0.3 },
    "ai_ethics": { label: "AI Ethics", mastery: 0.2 },
    "machine_learning": { label: "Machine Learning", mastery: 0.1 },
    "team_leadership": { label: "Team Leadership", mastery: 0.4 },
    "project_management": { label: "Project Management", mastery: 0.2 },
    "customer_service": { label: "Customer Service", mastery: 0.3 },
    "sales_negotiation": { label: "Sales & Negotiation", mastery: 0.2 },
    "conflict_resolution": { label: "Conflict Resolution", mastery: 0.1 },
    "presentation_skills": { label: "Presentation Skills", mastery: 0.3 },
    "data_analysis": { label: "Data Analysis", mastery: 0.1 }
  };

  // Filter function (same logic as the real app)
  const filterTopics = () => {
    return Object.entries(mockTopics).filter(([id, topic]) => {
      const mastery = topic.mastery;
      let matchesMastery = true;
      
      if (selectedMasteryLevel === 'low') {
        matchesMastery = mastery < 0.3;
      } else if (selectedMasteryLevel === 'medium') {
        matchesMastery = mastery >= 0.3 && mastery < 0.7;
      } else if (selectedMasteryLevel === 'high') {
        matchesMastery = mastery >= 0.7;
      }

      return matchesMastery;
    });
  };

  const filteredTopics = filterTopics();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 Mastery Filter Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Mastery Level Filter:</label>
        <select 
          value={selectedMasteryLevel} 
          onChange={(e) => setSelectedMasteryLevel(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          <option value="all">All Levels</option>
          <option value="low">Low Mastery (&lt;30%)</option>
          <option value="medium">Medium Mastery (30-70%)</option>
          <option value="high">High Mastery (&gt;70%)</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Filter Results: {filteredTopics.length} of {Object.keys(mockTopics).length} topics</strong>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {filteredTopics.map(([id, topic]) => (
          <div key={id} style={{ 
            padding: '10px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            background: '#f9f9f9'
          }}>
            <strong>{topic.label}</strong> - {Math.round(topic.mastery * 100)}% mastery
            {selectedMasteryLevel === 'medium' && topic.mastery < 0.3 && (
              <span style={{ color: 'red', marginLeft: '10px' }}>
                ⚠️ This should NOT be visible with Medium filter!
              </span>
            )}
            {selectedMasteryLevel === 'medium' && topic.mastery >= 0.3 && topic.mastery < 0.7 && (
              <span style={{ color: 'green', marginLeft: '10px' }}>
                ✅ Correctly filtered for Medium
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e8', borderRadius: '4px' }}>
        <h3>Expected Results:</h3>
        <ul>
          <li><strong>Low Mastery (&lt;30%):</strong> Machine Learning (10%), Data Analysis (10%), Conflict Resolution (10%), Sales & Negotiation (20%), AI Ethics (20%), Project Management (20%)</li>
          <li><strong>Medium Mastery (30-70%):</strong> Prompt Engineering (30%), Customer Service (30%), Presentation Skills (30%), Team Leadership (40%)</li>
          <li><strong>High Mastery (&gt;70%):</strong> None</li>
        </ul>
      </div>
    </div>
  );
};

export default FilterTest;
