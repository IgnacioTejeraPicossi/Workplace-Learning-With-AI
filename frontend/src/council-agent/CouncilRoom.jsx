import React, { useState, useEffect } from 'react';

const CouncilRoom = () => {
  const [sending, setSending] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [deliberation, setDeliberation] = useState(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const response = await fetch('/agents/council/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error("Failed to load personas:", error);
    }
  };

  // Generate HMAC signature for Council actions
  const generateHMACSignature = async (payload) => {
    const secret = 'change-me'; // Should match HMAC_SECRET from backend
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    // Canonicalize JSON exactly like backend does (recursive sort_keys=True, separators=(',', ':'))
    const canonicalJson = JSON.stringify(payload, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sorted = {};
        Object.keys(value).sort().forEach(k => sorted[k] = value[k]);
        return sorted;
      }
      return value;
    });
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonicalJson));
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const runDeliberation = async () => {
    setSending(true);
    try {
      const run = `council-${Date.now()}`;
      const bundle = {
        run_id: run,
        topic: "Adopt passkeys company-wide in 2026?",
        context_md: "EU bank, mobile-first, legacy SSO in place. Need to balance security, user experience, and operational costs.",
        personas: personas.slice(0, 4), // Use first 4 personas
        sources: [
          {
            url: "https://www.w3.org/TR/webauthn/",
            source: "W3C",
            snippet: "Passkeys overview and technical specification"
          },
          {
            url: "internal://policy/authn2024",
            source: "Company",
            snippet: "Current SSO posture and security requirements"
          }
        ],
        actions: [
          {
            type: "council.generate",
            payload: {}
          },
          {
            type: "publish.slack",
            payload: {
              channel: "#council-briefs",
              topic: "Adopt passkeys company-wide in 2026?"
            }
          }
        ],
        callback_url: "/api/agent-runs/callback"
      };

      // Generate proper HMAC signature
      const signature = await generateHMACSignature(bundle);

      const response = await fetch('/agents/council/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        body: JSON.stringify(bundle)
      });

      if (response.ok) {
        const result = await response.json();
        setDeliberation(result);
        alert('Council deliberation completed successfully!');
      } else {
        const error = await response.text();
        alert(`Failed to run deliberation: ${error}`);
      }
    } catch (error) {
      console.error("Failed to run deliberation:", error);
      alert('Error running deliberation');
    } finally {
      setSending(false);
    }
  };

  const getPersonaColor = (lens) => {
    switch (lens) {
      case 'Security': return 'bg-red-100 text-red-800';
      case 'Ethics': return 'bg-green-100 text-green-800';
      case 'Finance': return 'bg-blue-100 text-blue-800';
      case 'Policy': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Council Room</h2>
          <p className="text-gray-600">Debate topics from diverse perspectives and generate consensus briefs</p>
        </div>
        <button
          onClick={runDeliberation}
          disabled={sending}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {sending ? "Deliberating..." : "Run Sample Deliberation"}
        </button>
      </div>

      {/* Personas Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Personas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {personas.map((persona) => (
            <div key={persona.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{persona.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaColor(persona.lens)}`}>
                  {persona.lens}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{persona.region}</p>
              <p className="text-xs text-gray-500">{persona.expertise_tags}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deliberation Results */}
      {deliberation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliberation Results</h3>
          
          {/* Brief */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Council Brief</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {deliberation.artifacts.brief_md}
              </pre>
            </div>
          </div>

          {/* Persona Arguments */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Persona Perspectives</h4>
            <div className="space-y-4">
              {deliberation.artifacts.persona_arguments?.map((persona, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{persona.persona_name}</h5>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaColor(persona.lens)}`}>
                        {persona.lens}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Score: {(persona.scores.final * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{persona.argument}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Confidence: {(persona.confidence * 100).toFixed(0)}%</span>
                    <span>Citations: {persona.citations?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agreements, Disagreements, Unknowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">Agreements ({deliberation.artifacts.agreements?.length || 0})</h5>
              <ul className="text-sm text-green-700 space-y-1">
                {deliberation.artifacts.agreements?.map((agreement, index) => (
                  <li key={index}>• {agreement.statement}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="font-medium text-red-900 mb-2">Disagreements ({deliberation.artifacts.disagreements?.length || 0})</h5>
              <ul className="text-sm text-red-700 space-y-1">
                {deliberation.artifacts.disagreements?.map((disagreement, index) => (
                  <li key={index}>• {disagreement.statement}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">Unknowns ({deliberation.artifacts.unknowns?.length || 0})</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {deliberation.artifacts.unknowns?.map((unknown, index) => (
                  <li key={index}>• {unknown.statement}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Me More/Less */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Challenge Me More</h3>
        <p className="text-gray-700 mb-4">
          Add more diverse personas to challenge your assumptions and get different perspectives on complex topics.
        </p>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Add Security Persona
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Add Ethics Persona
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            Add Policy Persona
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouncilRoom;
