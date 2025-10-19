import React from 'react';

export default function TrendLine({ items }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const data = (items || []).slice().sort((a,b)=>a.year-b.year);
    if (!window.Chart || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const chart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(i => `${i.model} (${i.year})`),
        datasets: [{ label: 'AGI %', data: data.map(i => i.total), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true }]
      },
      options: { responsive: true, scales: { y: { min: 0, max: 100 } } }
    });
    return () => chart.destroy();
  }, [items]);
  return <canvas ref={canvasRef} height={220} />;
}


