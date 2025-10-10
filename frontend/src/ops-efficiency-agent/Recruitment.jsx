import React, { useState, useEffect } from 'react';

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
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'test-signature' // In production, generate proper HMAC
        },
        body: JSON.stringify(bundle)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Ops Efficiency execution result:', result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to execute Ops Efficiency:', error);
      throw error;
    }
  };

  const handleRankCandidates = async () => {
    if (!jobCriteria.trim()) {
      alert('Please enter job criteria');
      return;
    }

    setSending(true);
    try {
      const runId = `opsx-ats-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: "CV Ranking: Backend Developer",
        summary_md: `Ranking ${candidates.length} candidates against job criteria`,
        actions: [
          {
            type: "ats.rank",
            payload: {
              jobId: "JOB-2024-001",
              criteria: jobCriteria,
              candidates: candidates.map(candidate => ({
                id: candidate.id,
                text: candidate.cv_text
              }))
            }
          },
          {
            type: "sheets.appendRow",
            payload: {
              range: "ATS!A1",
              values: [
                ["Job ID", "Candidate ID", "Score", "Top Skills", "Processed At"],
                ...candidates.map(candidate => [
                  "JOB-2024-001",
                  candidate.id,
                  "0.85", // Mock score
                  "Python, FastAPI, MongoDB",
                  new Date().toISOString()
                ])
              ]
            }
          },
          {
            type: "notify.slack",
            payload: {
              channel: "#hr",
              text: `CV ranking completed for ${candidates.length} candidates`,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: "👥 CV Ranking Complete"
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: "*Job:*\nBackend Developer"
                    },
                    {
                      type: "mrkdwn",
                      text: "*Candidates Ranked:*\n" + candidates.length
                    },
                    {
                      type: "mrkdwn",
                      text: "*Top Candidate:*\n" + (candidates[0]?.id || "N/A")
                    },
                    {
                      type: "mrkdwn",
                      text: "*Score:*\n85%"
                    }
                  ]
                }
              ]
            }
          }
        ],
        callback_url: "/api/agent-runs/callback"
      };

      const result = await executeOpsx(bundle);
      
      // Mock ranking results for demo
      const mockResults = candidates.map((candidate, index) => ({
        candidateId: candidate.id,
        score01: 0.95 - (index * 0.1), // Mock decreasing scores
        highlights: [
          {
            text: "5+ years experience with Python and FastAPI",
            matched_keywords: ["Python", "FastAPI"],
            relevance_score: 0.9
          },
          {
            text: "Strong background in MongoDB and database design",
            matched_keywords: ["MongoDB", "database"],
            relevance_score: 0.8
          }
        ],
        cv_url: candidate.cv_url,
        processed_at: new Date().toISOString()
      })).sort((a, b) => b.score01 - a.score01);

      setRankingResults(mockResults);
      alert('CV ranking completed successfully!');
    } catch (error) {
      alert(`Failed to rank candidates: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newCandidates = files.map((file, index) => ({
      id: `CAND-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      cv_text: `Mock CV content for ${file.name}. This candidate has experience with Python, FastAPI, MongoDB, Docker, and REST APIs. Strong background in backend development and database design.`,
      cv_url: URL.createObjectURL(file),
      file: file
    }));

    setCandidates(prev => [...prev, ...newCandidates]);
  };

  const removeCandidate = (candidateId) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
  };

  const getScoreBadge = (score) => {
    const percentage = Math.round(score * 100);
    const color = percentage >= 80 ? 'bg-green-100 text-green-800' : 
                  percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {percentage}%
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CV Ranking</h1>
        <p className="text-lg text-gray-600 mt-2">Rank candidates against job criteria with evidence highlighting</p>
      </div>

      {/* Job Criteria Input */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Criteria</h2>
        <textarea
          value={jobCriteria}
          onChange={(e) => setJobCriteria(e.target.value)}
          placeholder="Enter job requirements, skills, and criteria (e.g., Python, FastAPI, MongoDB, Docker, 3+ years experience)"
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* File Upload */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CVs</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            id="cv-upload"
          />
          <label
            htmlFor="cv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <span className="text-4xl mb-2">📄</span>
            <span className="text-lg font-medium text-gray-700">Click to upload CVs</span>
            <span className="text-sm text-gray-500">PDF, DOC, DOCX files supported</span>
          </label>
        </div>
      </div>

      {/* Candidates List */}
      {candidates.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Candidates ({candidates.length})
          </h2>
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👤</span>
                  <div>
                    <div className="font-medium text-gray-900">{candidate.name}</div>
                    <div className="text-sm text-gray-500">ID: {candidate.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => removeCandidate(candidate.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rank Button */}
      {candidates.length > 0 && jobCriteria.trim() && (
        <div className="mb-6">
          <button
            onClick={handleRankCandidates}
            disabled={sending}
            className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Ranking Candidates...' : `Rank ${candidates.length} Candidates`}
          </button>
        </div>
      )}

      {/* Ranking Results */}
      {rankingResults && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ranking Results</h2>
          <div className="space-y-4">
            {rankingResults.map((result, index) => {
              const candidate = candidates.find(c => c.id === result.candidateId);
              return (
                <div key={result.candidateId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🏆</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          #{index + 1} {candidate?.name || result.candidateId}
                        </div>
                        <div className="text-sm text-gray-500">ID: {result.candidateId}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getScoreBadge(result.score01)}
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Export to Sheets
                      </button>
                    </div>
                  </div>
                  
                  {/* Highlights */}
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Highlights:</h4>
                    <div className="space-y-2">
                      {result.highlights.map((highlight, idx) => (
                        <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                          <p className="text-sm text-gray-700">{highlight.text}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {highlight.matched_keywords.map((keyword, kIdx) => (
                              <span
                                key={kIdx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                              >
                                {keyword}
                              </span>
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
      )}

      {/* Demo Data */}
      {candidates.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Data</h3>
          <p className="text-gray-600 mb-4">
            Upload CV files or use the demo data below to test the ranking functionality.
          </p>
          <button
            onClick={() => {
              setCandidates([
                {
                  id: 'CAND-DEMO-001',
                  name: 'John Doe',
                  cv_text: 'Senior Backend Developer with 5+ years experience in Python, FastAPI, MongoDB, Docker, and REST APIs. Strong background in microservices architecture and database design.',
                  cv_url: null
                },
                {
                  id: 'CAND-DEMO-002',
                  name: 'Jane Smith',
                  cv_text: 'Full-stack developer with experience in Java, Spring Boot, PostgreSQL, and React. Some Python experience but primarily Java-focused.',
                  cv_url: null
                },
                {
                  id: 'CAND-DEMO-003',
                  name: 'Mike Johnson',
                  cv_text: 'Python developer with 3 years experience in Django, PostgreSQL, and AWS. Looking to transition to FastAPI and MongoDB.',
                  cv_url: null
                }
              ]);
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Load Demo Candidates
          </button>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
