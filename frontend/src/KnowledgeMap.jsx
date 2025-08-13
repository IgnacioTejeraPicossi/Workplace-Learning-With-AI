import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { auth } from './firebase';
import MasteryTimeline from './MasteryTimeline';
import AdvancedRecommendations from './AdvancedRecommendations';
import AdvancedTooltip from './AdvancedTooltip';
import ClusterLegend from './ClusterLegend';
import AdvancedMasteryPanel from './AdvancedMasteryPanel';
import WebSearchResults from './WebSearchResults';
import * as d3 from 'd3';

const KnowledgeMap = () => {
  const [topics, setTopics] = useState({});
  const [userData, setUserData] = useState(null);
  const [clusters, setClusters] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [learningPaths, setLearningPaths] = useState([]);
  const [vectorAnalysis, setVectorAnalysis] = useState(null);
  
  // Web search states
  const [webSearchResults, setWebSearchResults] = useState([]);
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webSearchTopic, setWebSearchTopic] = useState('');
  const [showWebSearch, setShowWebSearch] = useState(false);
  
  // Tooltip and interaction states
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activeClusters, setActiveClusters] = useState(Object.keys(clusters));
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMasteryLevel, setSelectedMasteryLevel] = useState('all');
  const [filteredTopics, setFilteredTopics] = useState({});
  
  const svgRef = useRef(null);
  const { colors } = useTheme();

  // Color palette for different clusters
  const clusterColors = {
    'AI Fundamentals': '#4CAF50',
    'Leadership': '#2196F3', 
    'Business Applications': '#FF9800',
    'Communication': '#9C27B0'
  };

  // Web search function
  const performWebSearch = async (topic) => {
    setWebSearchTopic(topic);
    setWebSearchLoading(true);
    setShowWebSearch(true);
    
    try {
      const response = await fetch('/api/simple-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          limit: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebSearchResults(data.results || []);
      } else {
        console.error('Web search failed:', response.statusText);
        setWebSearchResults([]);
      }
    } catch (error) {
      console.error('Web search error:', error);
      setWebSearchResults([]);
    } finally {
      setWebSearchLoading(false);
    }
  };

  // Filter topics based on search and filter criteria
  useEffect(() => {
    if (!topics || Object.keys(topics).length === 0) return;

    const filtered = Object.entries(topics).filter(([id, topic]) => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        topic.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        topic.category === selectedCategory;

      // Mastery level filter
      const mastery = userData?.mastery_scores?.[id] || 0;
      let matchesMastery = true;
      if (selectedMasteryLevel === 'low') {
        matchesMastery = mastery < 0.3;
      } else if (selectedMasteryLevel === 'medium') {
        matchesMastery = mastery >= 0.3 && mastery < 0.7;
      } else if (selectedMasteryLevel === 'high') {
        matchesMastery = mastery >= 0.7;
      }

      // Debug logging for mastery filter
      if (selectedMasteryLevel !== 'all') {
        console.log(`🔍 Filtering ${topic.label}: mastery=${(mastery * 100).toFixed(0)}%, filter=${selectedMasteryLevel}, matches=${matchesMastery}`);
      }

      return matchesSearch && matchesCategory && matchesMastery;
    });

    const filteredTopicsObj = Object.fromEntries(filtered);
    setFilteredTopics(filteredTopicsObj);
    
    // Log filtered results
    console.log(`📊 Filter Results: ${Object.keys(filteredTopicsObj).length} topics match filters`);
    console.log(`📊 Filtered Topics:`, Object.keys(filteredTopicsObj).map(id => ({
      id,
      label: topics[id]?.label,
      mastery: userData?.mastery_scores?.[id] || 0
    })));
  }, [topics, searchTerm, selectedCategory, selectedMasteryLevel, userData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [topicsRes, clustersRes] = await Promise.all([
          fetch('/api/knowledge-map/topics'),
          fetch('/api/knowledge-map/clusters')
        ]);

        if (!topicsRes.ok) {
          throw new Error(`Topics API error: ${topicsRes.status}`);
        }
        if (!clustersRes.ok) {
          throw new Error(`Clusters API error: ${clustersRes.status}`);
        }

        const topicsData = await topicsRes.json();
        const clustersData = await clustersRes.json();

        setTopics(topicsData.topics);
        setClusters(clustersData.clusters);

        // Fetch user data if authenticated
        if (auth.currentUser) {
          const userRes = await fetch(`/api/knowledge-map/user/${auth.currentUser.uid}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserData(userData);
            
            // Fetch recommendations after user data is loaded
            await fetchRecommendations(auth.currentUser.uid);
          }
        } else {
          // Use mock user data for testing
          const mockUserData = {
            user_id: 'test-user',
            mastery_scores: {
              "prompt_engineering": 0.3,  // Lowered from 0.8
              "ai_ethics": 0.2,           // Lowered from 0.6
              "machine_learning": 0.1,    // Lowered from 0.4
              "team_leadership": 0.4,     // Lowered from 0.9
              "project_management": 0.2,  // Lowered from 0.7
              "customer_service": 0.3,    // Kept at 0.3
              "sales_negotiation": 0.2,   // Kept at 0.2
              "conflict_resolution": 0.1, // Lowered from 0.5
              "presentation_skills": 0.3, // Lowered from 0.8
              "data_analysis": 0.1        // Kept at 0.1
            },
            progress: {
              lessonsCompleted: 12,
              simulationsCompleted: 1,
              simulationScore: 1,
              lastActivity: "2025-01-30T10:00:00Z"
            },
            recommended_next: "machine_learning"
          };
          setUserData(mockUserData);
          
          // Fetch recommendations for test user
          await fetchRecommendations('test-user');
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
        
        // Set fallback data for testing
        setTopics({
          "prompt_engineering": {
            "id": "prompt_engineering",
            "label": "Prompt Engineering",
            "description": "Master the art of crafting effective AI prompts",
            "embedding": [0.1, 0.2, 0.3, 0.4, 0.5],
            "category": "AI Fundamentals"
          },
          "ai_ethics": {
            "id": "ai_ethics", 
            "label": "AI Ethics",
            "description": "Understanding ethical considerations in AI development",
            "embedding": [0.2, 0.3, 0.4, 0.5, 0.6],
            "category": "AI Fundamentals"
          }
        });
        setClusters({
          "AI Fundamentals": ["prompt_engineering", "ai_ethics"]
        });
        const fallbackUserData = {
          user_id: 'fallback-user',
          mastery_scores: {
            "prompt_engineering": 0.2,  // Lowered from 0.8
            "ai_ethics": 0.1            // Lowered from 0.6
          },
          progress: {
            lessonsCompleted: 2,
            simulationsCompleted: 1,
            simulationScore: 1,
            lastActivity: "2025-01-30T10:00:00Z"
          },
          recommended_next: "ai_ethics"
        };
        setUserData(fallbackUserData);
        
        // Fetch recommendations for fallback user
        await fetchRecommendations('fallback-user');
      }
    };

    fetchData();
  }, []);

  const fetchRecommendations = async (userId) => {
    try {
      setRecommendationsLoading(true);
      
      const response = await fetch(`/api/knowledge-map/recommendations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setLearningPaths(data.learning_paths || []);
        setVectorAnalysis(data.vector_analysis || null);
      } else {
        setRecommendations([]);
        setLearningPaths([]);
        setVectorAnalysis(null);
      }
    } catch (error) {
      setRecommendations([]);
      setLearningPaths([]);
      setVectorAnalysis(null);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && Object.keys(topics).length > 0 && svgRef.current) {
      renderMap();
    }
  }, [topics, filteredTopics, userData, clusters, loading]);

  const renderMap = () => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = ''; // Clear previous content

    // Get dynamic dimensions from container
    const container = svg.parentElement;
    const width = container ? container.clientWidth - 48 : 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create nodes with improved positioning - Use all topics, not filtered
    const nodes = Object.entries(topics).map(([id, topic]) => {
      const mastery = userData?.mastery_scores?.[id] || 0;
      const cluster = Object.entries(clusters).find(([clusterName, topicIds]) =>
        topicIds.includes(id)
      )?.[0] || 'Other';
      
      // Check if this topic is recommended
      const isRecommended = recommendations.some(rec => rec.topic_id === id);
      
      // Check if this topic should be visible based on filters
      const isVisible = Object.keys(filteredTopics).includes(id);
      
      return {
        id, 
        label: topic.label, 
        description: topic.description, 
        mastery, 
        cluster,
        category: topic.category,
        x: centerX + (Math.random() - 0.5) * (width * 0.6),
        y: centerY + (Math.random() - 0.5) * (height * 0.6),
        radius: 15 + mastery * 20,
        color: clusterColors[cluster] || '#666',
        isRecommended,
        isVisible,
        originalRadius: 15 + mastery * 20
      };
    });
    console.log('📊 Created advanced nodes:', nodes);
    console.log('🔍 Topics count:', Object.keys(topics).length);
    console.log('🔍 Filtered topics count:', Object.keys(filteredTopics).length);
    console.log('🔍 Visible nodes count:', nodes.filter(n => n.isVisible).length);

    // Setup D3 zoom behavior - Move after creating elements
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        const { transform } = event;
        setZoomLevel(transform.k);
        setPanOffset({ x: transform.x, y: transform.y });
        
        // Apply transform to all node groups and cluster labels
        d3.selectAll('.node-group').attr('transform', (d, i, nodes) => {
          const group = nodes[i];
          const originalTransform = group.getAttribute('data-original-transform') || `translate(0,0)`;
          return `${originalTransform} scale(${transform.k}) translate(${transform.x / transform.k}, ${transform.y / transform.k})`;
        });
        
        // Apply transform to cluster labels
        d3.selectAll('.cluster-label').attr('transform', (d, i, nodes) => {
          const label = nodes[i];
          const originalTransform = label.getAttribute('data-original-transform') || `translate(0,0)`;
          return `${originalTransform} scale(${transform.k}) translate(${transform.x / transform.k}, ${transform.y / transform.k})`;
        });
      });

    // Create SVG elements with advanced features
    nodes.forEach((node, index) => {
      try {
        // Skip nodes that are not visible based on filters
        if (!node.isVisible) {
          console.log(`⏭️ Skipping filtered node: ${node.label} (mastery: ${(node.mastery * 100).toFixed(0)}%)`);
          return;
        }
        
        // Create node group with class for D3 selection
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node-group');
        const originalTransform = `translate(${node.x}, ${node.y})`;
        group.setAttribute('transform', originalTransform);
        group.setAttribute('data-original-transform', originalTransform);
        group.style.cursor = 'pointer';

        // Create main circle with animation
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', node.radius);
        circle.setAttribute('fill', node.color);
        circle.setAttribute('stroke', colors.border);
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', 0.8);
        circle.setAttribute('class', 'node-circle');

        // Add pulse animation for recommended nodes
        if (node.isRecommended) {
          circle.setAttribute('class', 'node-circle recommended');
          circle.style.animation = 'pulse 2s infinite';
        }

        // Create glow effect for recommended nodes
        if (node.isRecommended) {
          const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          glow.setAttribute('r', node.radius + 4);
          glow.setAttribute('fill', 'none');
          glow.setAttribute('stroke', node.color);
          glow.setAttribute('stroke-width', '3');
          glow.setAttribute('opacity', '0.3');
          glow.setAttribute('class', 'node-glow');
          glow.style.animation = 'glow 2s infinite';
          group.appendChild(glow);
        }

        // Add hover effects with tooltip
        circle.addEventListener('mouseenter', (e) => {
          // Visual effects
          circle.setAttribute('opacity', '1');
          circle.setAttribute('stroke-width', '3');
          circle.setAttribute('stroke', colors.primary);
          circle.setAttribute('r', node.radius * 1.1);
          
          // Show tooltip
          const rect = svg.getBoundingClientRect();
          setTooltipPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
          setTooltipData({
            id: node.id,
            label: node.label,
            description: node.description,
            category: node.category,
            cluster: node.cluster
          });
          setTooltipVisible(true);
        });

        circle.addEventListener('mouseleave', () => {
          // Reset visual effects
          circle.setAttribute('opacity', '0.8');
          circle.setAttribute('stroke-width', '2');
          circle.setAttribute('stroke', colors.border);
          circle.setAttribute('r', node.radius);
          
          // Hide tooltip
          setTooltipVisible(false);
        });

        circle.addEventListener('click', () => {
          console.log('🖱️ Clicked node:', node);
          setSelectedTopic(node);
          
          // Trigger web search for this topic
          performWebSearch(node.label);
        });

        // Create text label with background for better visibility
        const textBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        textBackground.setAttribute('x', node.radius + 2);
        textBackground.setAttribute('y', -8);
        textBackground.setAttribute('width', node.label.length * 7 + 10);
        textBackground.setAttribute('height', 20);
        textBackground.setAttribute('fill', colors.background);
        textBackground.setAttribute('stroke', colors.border);
        textBackground.setAttribute('stroke-width', '1');
        textBackground.setAttribute('rx', '3');
        textBackground.setAttribute('opacity', '0.9');
        group.appendChild(textBackground);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.radius + 7);
        text.setAttribute('y', 4);
        text.setAttribute('font-size', '11px');
        text.setAttribute('fill', colors.text);
        text.setAttribute('font-weight', '600');
        text.setAttribute('pointer-events', 'none'); // Prevent interference with zoom
        text.textContent = node.label;

        // Create mastery indicator with background
        const masteryBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        masteryBackground.setAttribute('x', node.radius + 2);
        masteryBackground.setAttribute('y', 8);
        masteryBackground.setAttribute('width', 35);
        masteryBackground.setAttribute('height', 14);
        masteryBackground.setAttribute('fill', colors.background);
        masteryBackground.setAttribute('stroke', colors.border);
        masteryBackground.setAttribute('stroke-width', '1');
        masteryBackground.setAttribute('rx', '2');
        masteryBackground.setAttribute('opacity', '0.9');
        group.appendChild(masteryBackground);

        const masteryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        masteryText.setAttribute('x', node.radius + 7);
        masteryText.setAttribute('y', 18);
        masteryText.setAttribute('font-size', '9px');
        masteryText.setAttribute('fill', colors.textSecondary);
        masteryText.setAttribute('font-weight', '500');
        masteryText.setAttribute('pointer-events', 'none'); // Prevent interference with zoom
        masteryText.textContent = `${Math.round(node.mastery * 100)}%`;

        group.appendChild(circle);
        group.appendChild(textBackground);
        group.appendChild(masteryBackground);
        group.appendChild(text);
        group.appendChild(masteryText);
        svg.appendChild(group);

        console.log(`✅ Added node ${index + 1}/${nodes.length}:`, node.label);
      } catch (error) {
        console.error(`❌ Error creating node ${index}:`, error);
      }
    });

    // Add cluster labels with better positioning and visibility
    Object.entries(clusters).forEach(([clusterName, topicIds], index) => {
      try {
        const clusterNodes = nodes.filter(node => topicIds.includes(node.id));
        if (clusterNodes.length > 0) {
          const avgX = clusterNodes.reduce((sum, node) => sum + node.x, 0) / clusterNodes.length;
          const avgY = clusterNodes.reduce((sum, node) => sum + node.y, 0) / clusterNodes.length;

          // Add background rectangle for better visibility
          const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          background.setAttribute('x', avgX - 80);
          background.setAttribute('y', avgY - 70);
          background.setAttribute('width', 160);
          background.setAttribute('height', 30);
          background.setAttribute('fill', colors.background);
          background.setAttribute('stroke', clusterColors[clusterName] || '#666');
          background.setAttribute('stroke-width', '2');
          background.setAttribute('rx', '5');
          background.setAttribute('opacity', '0.9');
          svg.appendChild(background);

                     const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
           label.setAttribute('x', avgX);
           label.setAttribute('y', avgY - 50);
           label.setAttribute('font-size', '16px');
           label.setAttribute('font-weight', 'bold');
           label.setAttribute('fill', clusterColors[clusterName] || '#666');
           label.setAttribute('text-anchor', 'middle');
           label.setAttribute('pointer-events', 'none'); // Prevent interference with zoom
           label.setAttribute('class', 'cluster-label');
           const originalTransform = `translate(${avgX}, ${avgY - 50})`;
           label.setAttribute('data-original-transform', originalTransform);
           label.textContent = clusterName;

           svg.appendChild(label);
          console.log(`✅ Added cluster label: ${clusterName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating cluster label ${index}:`, error);
      }
    });

    // Apply zoom behavior after all elements are created
    d3.select(svg).call(zoom);
    
    console.log('🎉 Map rendering completed!');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: colors.text 
      }}>
        <div>Loading Knowledge Map...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🗺️ Map of Knowledge</h2>
      
      <p style={{ marginBottom: 20, color: colors.textSecondary }}>
        Visualize your learning journey across different knowledge domains. 
        Node size indicates your mastery level, and colors represent knowledge clusters.
      </p>

      {/* Knowledge Clusters Summary - Moved to main panel */}
      <div style={{
        background: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}>
        <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.text }}>
          📊 Knowledge Clusters
        </h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(clusters).map(([clusterName, topicIds]) => {
            const clusterTopics = topicIds.map(id => topics[id]).filter(Boolean);
            const avgMastery = clusterTopics.length > 0 
              ? clusterTopics.reduce((sum, topic) => {
                  const mastery = userData?.mastery_scores?.[topic.id] || 0;
                  return sum + mastery;
                }, 0) / clusterTopics.length
              : 0;
            
            return (
              <div key={clusterName} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: clusterColors[clusterName] || '#666'
                }} />
                <span style={{ fontSize: '0.9em', color: colors.textSecondary }}>
                  {clusterName}: {clusterTopics.length} topics, Avg: {Math.round(avgMastery * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filter Toolbar */}
      <div style={{
        background: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}>
        <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.text }}>
          🔍 Search & Filter Topics
        </h4>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '14px'
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '14px'
              }}
            >
              <option value="all">All Categories</option>
              <option value="AI Fundamentals">AI Fundamentals</option>
              <option value="Leadership">Leadership</option>
              <option value="Business Applications">Business Applications</option>
              <option value="Communication">Communication</option>
            </select>
          </div>

          {/* Mastery Level Filter */}
          <div style={{ minWidth: '120px' }}>
            <select
              value={selectedMasteryLevel}
              onChange={(e) => setSelectedMasteryLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '14px'
              }}
            >
              <option value="all">All Levels</option>
              <option value="low">Low Mastery (&lt;30%)</option>
              <option value="medium">Medium Mastery (30-70%)</option>
              <option value="high">High Mastery (&gt;70%)</option>
            </select>
          </div>

          {/* Filter Results Counter */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: colors.sidebarBackground,
            borderRadius: 6,
            fontSize: '14px',
            color: colors.textSecondary
          }}>
            <span>📊</span>
            <span>
              {Object.keys(filteredTopics).length} of {Object.keys(topics).length} topics
            </span>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedMasteryLevel('all');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              cursor: 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            🗑️ Clear Filters
          </button>
        </div>

        {/* Results Counter */}
        <div style={{ marginTop: 12, fontSize: '0.9rem', color: colors.textSecondary }}>
          Showing {Object.keys(filteredTopics).length} of {Object.keys(topics).length} topics
        </div>
      </div>

      {/* Knowledge Map Visualization */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 24,
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`,
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        maxWidth: "100%",
        position: "relative"
      }}>
        <svg
          ref={svgRef}
          width="100%"
          height="500"
          style={{ 
            background: colors.background,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            maxWidth: "100%"
          }}
        />
        
        {/* Zoom Controls - Positioned inside the map container */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 100
        }}>
          <button
            onClick={() => {
              const svg = svgRef.current;
              if (svg) {
                const currentZoom = d3.zoomTransform(svg);
                const newScale = Math.min(currentZoom.k * 1.2, 3);
                d3.select(svg).transition().duration(300).call(
                  d3.zoom().transform,
                  d3.zoomIdentity.scale(newScale).translate(currentZoom.x, currentZoom.y)
                );
              }
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.textPrimary,
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              const svg = svgRef.current;
              if (svg) {
                const currentZoom = d3.zoomTransform(svg);
                const newScale = Math.max(currentZoom.k * 0.8, 0.5);
                d3.select(svg).transition().duration(300).call(
                  d3.zoom().transform,
                  d3.zoomIdentity.scale(newScale).translate(currentZoom.x, currentZoom.y)
                );
              }
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.textPrimary,
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            −
          </button>
          <button
            onClick={() => {
              const svg = svgRef.current;
              if (svg) {
                d3.select(svg).transition().duration(300).call(
                  d3.zoom().transform,
                  d3.zoomIdentity.scale(1).translate(0, 0)
                );
              }
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.textPrimary,
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🏠
          </button>
        </div>
      </div>

             {/* Legend */}
       <div style={{
         background: colors.cardBackground,
         borderRadius: 12,
         padding: 16,
         border: `1px solid ${colors.border}`,
         marginBottom: 20
       }}>
         <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.text }}>📋 Map Legend</h4>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
           {Object.entries(clusterColors).map(([clusterName, color]) => (
             <div key={clusterName} style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 8,
               padding: '4px 8px',
               borderRadius: '4px',
               backgroundColor: colors.background,
               border: `1px solid ${colors.border}`
             }}>
               <div style={{
                 width: 12,
                 height: 12,
                 borderRadius: '50%',
                 backgroundColor: color
               }} />
               <span style={{ fontSize: '0.9em', color: colors.textSecondary, fontWeight: '500' }}>
                 {clusterName}
               </span>
             </div>
           ))}
         </div>
         <div style={{ marginTop: 12, fontSize: '0.9em', color: colors.textSecondary }}>
           <strong>Node size:</strong> Larger nodes indicate higher mastery levels
         </div>
         <div style={{ marginTop: 8, fontSize: '0.9em', color: colors.textSecondary }}>
           <strong>Zoom:</strong> Use the controls on the map or mouse wheel to zoom in/out
         </div>
       </div>

               {/* Advanced Mastery Panel */}
        {userData && (
          <AdvancedMasteryPanel 
            userData={userData} 
            topics={topics} 
            recommendations={recommendations}
          />
        )}

      {/* Selected Topic Details */}
      {selectedTopic && (
        <div style={{
          background: colors.cardBackground,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${colors.border}`
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.text }}>
            {selectedTopic.label}
          </h4>
          <p style={{ marginBottom: 12, color: colors.textSecondary }}>
            {selectedTopic.description}
          </p>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: colors.text }}>Mastery Level:</strong>
            <span style={{ 
              marginLeft: 8, 
              color: selectedTopic.mastery > 0.7 ? '#4CAF50' : 
                     selectedTopic.mastery > 0.4 ? '#FF9800' : '#F44336'
            }}>
              {Math.round(selectedTopic.mastery * 100)}%
            </span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: colors.text }}>Cluster:</strong>
            <span style={{ marginLeft: 8, color: colors.textSecondary }}>
              {selectedTopic.cluster}
            </span>
          </div>
          <button
            onClick={() => setSelectedTopic(null)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* User Progress Summary */}
      {userData && (
        <div style={{
          background: colors.primaryLight,
          borderRadius: 12,
          padding: 16,
          marginTop: 20
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.text }}>
            Your Learning Progress
          </h4>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: colors.text }}>Lessons Completed:</strong>
              <span style={{ marginLeft: 8, color: colors.textSecondary }}>
                {userData.progress.lessonsCompleted}
              </span>
            </div>
            <div>
              <strong style={{ color: colors.text }}>Simulations Completed:</strong>
              <span style={{ marginLeft: 8, color: colors.textSecondary }}>
                {userData.progress.simulationsCompleted}
              </span>
            </div>
            <div>
              <strong style={{ color: colors.text }}>Recommended Next:</strong>
              <span style={{ marginLeft: 8, color: colors.primary }}>
                {topics[userData.recommended_next]?.label || 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

              {/* Advanced Learning Recommendations */}
        <div style={{ marginTop: 20 }}>
          {recommendationsLoading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: colors.textSecondary,
              backgroundColor: colors.background,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🧠</div>
              <div>Analyzing your learning patterns with AI...</div>
              <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.7 }}>
                Calculating vector proximity and learning paths
              </div>
            </div>
          ) : (
            <AdvancedRecommendations
              recommendations={recommendations}
              learningPaths={learningPaths}
              vectorAnalysis={vectorAnalysis}
              onTopicClick={(topicId) => {
                // Handle topic click - could highlight on map or navigate
                console.log('Topic clicked:', topicId);
                setSelectedTopic(topicId);
              }}
            />
          )}
        </div>

        {/* Advanced Tooltip */}
        {tooltipData && (
          <AdvancedTooltip
            topic={tooltipData}
            mastery={userData?.mastery_scores?.[tooltipData.id] || 0}
            recommendations={recommendations}
            position={tooltipPosition}
            visible={tooltipVisible}
            onClose={() => setTooltipVisible(false)}
          />
        )}

        {/* Cluster Legend - Removed from here, now in main panel */}
        {/* Zoom Controls - Moved inside map container */}

        {/* CSS Animations */}
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes glow {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(1); }
          }
          
          .node-circle {
            transition: all 0.2s ease;
          }
          
          .node-circle.recommended {
            filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.5));
          }
          
          .node-glow {
            pointer-events: none;
          }
        `}</style>

        {/* Web Search Results Panel */}
        {showWebSearch && (
          <WebSearchResults
            topic={webSearchTopic}
            results={webSearchResults}
            isLoading={webSearchLoading}
            onClose={() => setShowWebSearch(false)}
          />
        )}
    </div>
  );
};

export default KnowledgeMap; 