import React, { useEffect, useRef } from 'react';
import './ArchitectureDiagram.css';

const ArchitectureDiagram = ({ architectureData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!architectureData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    
    // Parse architecture data with better error handling
    const layersData = architectureData?.layers || {};
    const components = architectureData?.components || [];
    const connections = architectureData?.relationships || [];
    
    // Convert layers object to array format for rendering
    const layers = Object.entries(layersData).map(([layerName, layerComponents]) => ({
      name: layerName.charAt(0).toUpperCase() + layerName.slice(1),
      type: layerName,
      description: `${Array.isArray(layerComponents) ? layerComponents.length : 0} components`,
      components: Array.isArray(layerComponents) ? layerComponents : []
    }));
    
    // Colors for different layer types
    const layerColors = {
      'frontend': '#4A90E2',
      'backend': '#50C878',
      'database': '#FF6B6B',
      'external': '#FFD93D',
      'infrastructure': '#9B59B6'
    };
    
    // Draw layers
    const layerHeight = 80;
    const startY = 50;
    
    if (layers.length === 0) {
      // Draw a message when no layers are available
      ctx.fillStyle = '#666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No architecture layers detected', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    layers.forEach((layer, index) => {
      const y = startY + (index * (layerHeight + 20));
      
      // Draw layer background
      ctx.fillStyle = layerColors[layer.type] || '#E0E0E0';
      ctx.fillRect(20, y, canvas.width - 40, layerHeight);
      
      // Draw layer title
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(layer.name, 30, y + 25);
      
      // Draw layer description
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(layer.description || '', 30, y + 45);
    });
    
    // Draw components
    const componentRadius = 25;
    const componentSpacing = 120;
    const startX = 50;
    
    components.forEach((component, index) => {
      if (!component || typeof component !== 'object') return;
      
      const x = startX + (index * componentSpacing);
      const y = startY + 40; // Center in first layer
      
      // Draw component circle
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(x, y, componentRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw component border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw component name
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(component.name || 'Unknown', x, y + 4);
      
      // Draw component type
      ctx.font = '10px Arial';
      ctx.fillText(component.type || '', x, y + 18);
    });
    
    // Draw connections
    connections.forEach(connection => {
      if (!connection || typeof connection !== 'object') return;
      
      const fromComponent = components.find(c => c && c.name === connection.from);
      const toComponent = components.find(c => c && c.name === connection.to);
      
      if (fromComponent && toComponent) {
        const fromIndex = components.indexOf(fromComponent);
        const toIndex = components.indexOf(toComponent);
        
        const fromX = startX + (fromIndex * componentSpacing);
        const toX = startX + (toIndex * componentSpacing);
        const y = startY + 40;
        
        // Draw arrow
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromX + componentRadius, y);
        ctx.lineTo(toX - componentRadius, y);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(toX - componentRadius, y);
        ctx.lineTo(toX - componentRadius - 8, y - 4);
        ctx.lineTo(toX - componentRadius - 8, y + 4);
        ctx.closePath();
        ctx.fillStyle = '#333';
        ctx.fill();
        
        // Draw connection label
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(connection.type || '', (fromX + toX) / 2, y - 10);
      }
    });
    
  }, [architectureData]);

  if (!architectureData) {
    return (
      <div className="architecture-diagram">
        <div className="no-data">
          <h3>Architecture Diagram</h3>
          <p>No architecture data available</p>
        </div>
      </div>
    );
  }

  // Add error boundary for invalid data
  if (typeof architectureData !== 'object') {
    return (
      <div className="architecture-diagram">
        <div className="no-data">
          <h3>Architecture Diagram</h3>
          <p>Invalid architecture data format</p>
        </div>
      </div>
    );
  }

  return (
    <div className="architecture-diagram">
      <h3>Project Architecture</h3>
      <div className="diagram-container">
        <canvas 
          ref={canvasRef}
          className="architecture-canvas"
        />
      </div>
      <div className="architecture-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color frontend"></div>
            <span>Frontend</span>
          </div>
          <div className="legend-item">
            <div className="legend-color backend"></div>
            <span>Backend</span>
          </div>
          <div className="legend-item">
            <div className="legend-color database"></div>
            <span>Database</span>
          </div>
          <div className="legend-item">
            <div className="legend-color external"></div>
            <span>External Services</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDiagram; 