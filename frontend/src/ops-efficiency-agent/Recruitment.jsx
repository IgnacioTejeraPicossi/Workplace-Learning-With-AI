import React, { useState } from 'react';

const Recruitment = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobCriteria, setJobCriteria] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rankingResults, setRankingResults] = useState(null);

  const executeOpsx = async (bundle) => {
    try {
      const response = await fetch('/agents/opsx/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': 'test-signature' },
        body: JSON.stringify(bundle)
      });
      if (response.ok) {
        const result = await response.json();
        return result;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Failed to execute Ops Efficiency:', error);
      throw error;
    }
  };

  const handleRankCandidates = async () => {
    if (!jobCriteria.trim()) { alert('Please enter job criteria'); return; }
    setSending(true);
    try {
      const runId = `opsx-ats-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: 'CV Ranking: Backend Developer',
        summary_md: `Ranking ${candidates.length} candidates against job criteria`,
        actions: [
          { type: 'ats.rank', payload: { jobId: 'JOB-2024-001', criteria: jobCriteria, candidates: candidates.map(c => ({ id: c.id, text: c.cv_text })) } },
          { type: 'sheets.appendRow', payload: { range: 'ATS!A1', values: [["Job ID","Candidate ID","Score","Top Skills","Processed At"], ...candidates.map(c => ['JOB-2024-001', c.id, '0.85', 'Python, FastAPI, MongoDB', new Date().toISOString()])] } },
          { type: 'notify.slack', payload: { channel: '#hr', text: `CV ranking completed for ${candidates.length} candidates` } }
        ],
        callback_url: '/api/agent-runs/callback'
      };
      await executeOpsx(bundle);
      const mockResults = candidates.map((candidate, index) => ({
        candidateId: candidate.id,
        score01: 0.95 - (index * 0.1),
        highlights: [
          { text: '5+ years experience with Python and FastAPI', matched_keywords: ['Python','FastAPI'], relevance_score: 0.9 },
          { text: 'Strong background in MongoDB and database design', matched_keywords: ['MongoDB','database'], relevance_score: 0.8 }
        ],
        cv_url: candidate.cv_url,
        processed_at: new Date().toISOString()
      })).sort((a, b) => b.score01 - a.score01);
      setRankingResults(mockResults);
      alert('CV ranking completed successfully!');
    } catch (error) {
      alert(`Failed to rank candidates: ${error.message}`);
    } finally { setSending(false); }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newCandidates = files.map((file, index) => ({
      id: `CAND-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      cv_text: `Mock CV content for ${file.name}. This candidate has experience with Python, FastAPI, MongoDB, Docker, and REST APIs. Strong background in backend development and database design.`,
      cv_url: URL.createObjectURL(file),
      file
    }));
    setCandidates(prev => [...prev, ...newCandidates]);
  };

  const removeCandidate = (candidateId) => { setCandidates(prev => prev.filter(c => c.id !== candidateId)); };

  const getScoreBadge = (score) => {
    const percentage = Math.round(score * 100);
    const style = percentage >= 80 ? { bg: '#DCFCE7', color: '#166534' } : percentage >= 60 ? { bg: '#FEF3C7', color: '#92400E' } : { bg: '#FEE2E2', color: '#991B1B' };
    return <span style={{ padding: '0.25rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, background: style.bg, color: style.color }}>{percentage}%</span>;
  };

  const container = { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' };
  const card = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
  const cardHeader = { padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb' };
  const section = { padding: 16 };
  const input = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: 8 };
  const label = { display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 8 };
  const btn = (bg, text, border) => ({ padding: '0.6rem 1rem', borderRadius: 8, background: bg, color: text, border: `1px solid ${border}`, cursor: 'pointer' });

  return (
    <div style={container}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>CV Ranking</h1>
        <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>Rank candidates against job criteria with evidence highlighting</p>
      </div>

      {/* Job Criteria */}
      <div style={card}>
        <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Job Criteria</h2></div>
        <div style={section}>
          <textarea value={jobCriteria} onChange={(e) => setJobCriteria(e.target.value)} placeholder="Enter job requirements, skills, and criteria (e.g., Python, FastAPI, MongoDB, Docker, 3+ years experience)" style={{ ...input, height: 110 }} />
        </div>
      </div>

      {/* Upload CVs */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Upload CVs</h2></div>
        <div style={section}>
          <div style={{ border: '2px dashed #D1D5DB', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleFileUpload} id="cv-upload" style={{ display: 'none' }} />
            <label htmlFor="cv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 36, marginBottom: 8 }}>📄</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Click to upload CVs</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>PDF, DOC, DOCX files supported</span>
            </label>
          </div>
        </div>
      </div>

      {/* Candidates */}
      {candidates.length > 0 && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Candidates ({candidates.length})</h2></div>
          <div style={section}>
            <div style={{ display: 'grid', rowGap: 10 }}>
              {candidates.map((candidate) => (
                <div key={candidate.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #E5E7EB', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>👤</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>ID: {candidate.id}</div>
                    </div>
                  </div>
                  <button onClick={() => removeCandidate(candidate.id)} style={{ color: '#991B1B', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rank Button */}
      {candidates.length > 0 && jobCriteria.trim() && (
        <div style={{ marginTop: 12 }}>
          <button onClick={handleRankCandidates} disabled={sending} style={btn('#7C3AED', '#FFFFFF', '#6D28D9')}>{sending ? 'Ranking Candidates...' : `Rank ${candidates.length} Candidates`}</button>
        </div>
      )}

      {/* Results */}
      {rankingResults && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Ranking Results</h2></div>
          <div style={section}>
            <div style={{ display: 'grid', rowGap: 12 }}>
              {rankingResults.map((result, index) => {
                const candidate = candidates.find(c => c.id === result.candidateId);
                return (
                  <div key={result.candidateId} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>🏆</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>#{index + 1} {candidate?.name || result.candidateId}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>ID: {result.candidateId}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {getScoreBadge(result.score01)}
                        <button style={{ color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Export to Sheets</button>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Key Highlights:</h4>
                      <div style={{ display: 'grid', rowGap: 6 }}>
                        {result.highlights.map((highlight, idx) => (
                          <div key={idx} style={{ background: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: 10 }}>
                            <p style={{ margin: 0, color: '#374151' }}>{highlight.text}</p>
                            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {highlight.matched_keywords.map((keyword, kIdx) => (
                                <span key={kIdx} style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 12, background: '#FDE68A', color: '#92400E' }}>{keyword}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Demo Data */}
      {candidates.length === 0 && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.1rem', fontWeight: 600 }}>Demo Data</h3>
          <p style={{ color: '#4B5563', marginBottom: 12 }}>Upload CV files or use the demo data below to test the ranking functionality.</p>
          <button onClick={() => { setCandidates([{ id: 'CAND-DEMO-001', name: 'John Doe', cv_text: 'Senior Backend Developer with 5+ years experience in Python, FastAPI, MongoDB, Docker, and REST APIs. Strong background in microservices architecture and database design.', cv_url: null }, { id: 'CAND-DEMO-002', name: 'Jane Smith', cv_text: 'Full-stack developer with experience in Java, Spring Boot, PostgreSQL, and React. Some Python experience but primarily Java-focused.', cv_url: null }, { id: 'CAND-DEMO-003', name: 'Mike Johnson', cv_text: 'Python developer with 3 years experience in Django, PostgreSQL, and AWS. Looking to transition to FastAPI and MongoDB.', cv_url: null }]); }} style={btn('#4B5563', '#FFFFFF', '#374151')}>Load Demo Candidates</button>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
