import React from 'react';

const LABELS = {
  K: 'Knowledge', RW: 'Read/Write', M: 'Math', R: 'Reasoning', WM: 'WorkMem',
  MS: 'MemStore', MR: 'MemRetrieval', V: 'Visual', A: 'Auditory', S: 'Speed'
};

export default function DomainRadar({ item }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const labels = Object.keys(item.scores || {}).map(k => LABELS[k] || k);
    const dataVals = Object.values(item.scores || {});
    if (!window.Chart || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const chart = new window.Chart(ctx, {
      type: 'radar',
      data: { labels, datasets: [{ label: item.model, data: dataVals, backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6' }] },
      options: { responsive: true, scales: { r: { min: 0, max: 10 } }, plugins: { legend: { display: false } } }
    });
    return () => chart.destroy();
  }, [item]);
  return <canvas ref={canvasRef} height={250} />;
}


