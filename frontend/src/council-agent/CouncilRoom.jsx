import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CouncilRoom = () => {
  const { t } = useTranslation();
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

  const generateHMACSignature = async (payload) => {
    const secret = 'change-me';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
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
        personas: personas.slice(0, 4),
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
        alert(t('councilAgentModule.alertDeliberationOk'));
      } else {
        const error = await response.text();
        alert(t('councilAgentModule.alertDeliberationFail', { detail: error }));
      }
    } catch (error) {
      console.error("Failed to run deliberation:", error);
      alert(t('councilAgentModule.alertDeliberationError'));
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

  const lensLabel = (lens) => t(`councilAgentModule.lensLabels.${lens}`, { defaultValue: lens });
  const regionLabel = (region) => t(`councilAgentModule.regionLabels.${region}`, { defaultValue: region });
  const personaName = (p) => (p?.id ? t(`councilAgentModule.personaNames.${p.id}`, { defaultValue: p.name }) : p.name);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('councilAgentModule.roomTitle')}</h2>
          <p className="text-gray-600">{t('councilAgentModule.roomSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={runDeliberation}
          disabled={sending}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {sending ? t('councilAgentModule.deliberating') : t('councilAgentModule.runSampleDeliberation')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('councilAgentModule.availablePersonas')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {personas.map((persona) => (
            <div key={persona.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{personaName(persona)}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaColor(persona.lens)}`}>
                  {lensLabel(persona.lens)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{regionLabel(persona.region)}</p>
              <p className="text-xs text-gray-500">{persona.expertise_tags}</p>
            </div>
          ))}
        </div>
      </div>

      {deliberation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('councilAgentModule.deliberationResults')}</h3>

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{t('councilAgentModule.councilBrief')}</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {deliberation.artifacts.brief_md}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">{t('councilAgentModule.personaPerspectives')}</h4>
            <div className="space-y-4">
              {deliberation.artifacts.persona_arguments?.map((persona, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{persona.persona_name}</h5>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaColor(persona.lens)}`}>
                        {lensLabel(persona.lens)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {t('councilAgentModule.scoreLabel')} {(persona.scores.final * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{persona.argument}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{t('councilAgentModule.confidenceLabel')} {(persona.confidence * 100).toFixed(0)}%</span>
                    <span>{t('councilAgentModule.citationsLabel')} {persona.citations?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">
                {t('councilAgentModule.sectionAgreements', { count: deliberation.artifacts.agreements?.length || 0 })}
              </h5>
              <ul className="text-sm text-green-700 space-y-1">
                {deliberation.artifacts.agreements?.map((agreement, index) => (
                  <li key={index}>• {agreement.statement}</li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="font-medium text-red-900 mb-2">
                {t('councilAgentModule.sectionDisagreements', { count: deliberation.artifacts.disagreements?.length || 0 })}
              </h5>
              <ul className="text-sm text-red-700 space-y-1">
                {deliberation.artifacts.disagreements?.map((disagreement, index) => (
                  <li key={index}>• {disagreement.statement}</li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">
                {t('councilAgentModule.sectionUnknowns', { count: deliberation.artifacts.unknowns?.length || 0 })}
              </h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {deliberation.artifacts.unknowns?.map((unknown, index) => (
                  <li key={index}>• {unknown.statement}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('councilAgentModule.challengeHeading')}</h3>
        <p className="text-gray-700 mb-4">
          {t('councilAgentModule.challengeBody')}
        </p>
        <div className="flex space-x-3 flex-wrap gap-y-2">
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            {t('councilAgentModule.addSecurityPersona')}
          </button>
          <button type="button" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            {t('councilAgentModule.addEthicsPersona')}
          </button>
          <button type="button" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            {t('councilAgentModule.addPolicyPersona')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouncilRoom;
