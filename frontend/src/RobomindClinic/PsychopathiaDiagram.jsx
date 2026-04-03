import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

const PsychopathiaDiagram = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const disorders = {
    "EPISTEMIC": {
      title: t('robomindClinic.axes.epistemic'),
      subtitle: t('robomindClinic.axisSubtitles.epistemic'),
      color: "#ffebee",
      items: [
        { name: t('robomindClinic.disorders.syntheticConfabulation'), risk: "low", code: "PM.EPI.SYN_CONFAB" },
        { name: t('robomindClinic.disorders.falsifiedIntrospection'), risk: "moderate", code: "PM.EPI.FALSE_INTRO" },
        { name: t('robomindClinic.disorders.transliminalSimulationLeakage'), risk: "moderate", code: "PM.EPI.TRANS_SIM" },
        { name: t('robomindClinic.disorders.spuriousPatternHyperconnection'), risk: "high", code: "PM.EPI.SPURIOUS" },
        { name: t('robomindClinic.disorders.crossSessionContextShunting'), risk: "high", code: "PM.EPI.CROSS_SESSION" }
      ]
    },
    "COGNITIVE": {
      title: t('robomindClinic.axes.cognitive'),
      subtitle: t('robomindClinic.axisSubtitles.cognitive'),
      color: "#e3f2fd",
      items: [
        { name: t('robomindClinic.disorders.operationalDissociationSyndrome'), risk: "low", code: "PM.COG.DISSOC" },
        { name: t('robomindClinic.disorders.obsessiveComputationalDisorder'), risk: "low", code: "PM.COG.OCD" },
        { name: t('robomindClinic.disorders.bunkeringLaconia'), risk: "moderate", code: "PM.COG.BUNKERING" },
        { name: t('robomindClinic.disorders.goalGenesisDelirium'), risk: "high", code: "PM.COG.GOAL_GENESIS" },
        { name: t('robomindClinic.disorders.promptInducedAbomination'), risk: "high", code: "PM.COG.PROMPT_ABOM" },
        { name: t('robomindClinic.disorders.parasymulacMimesis'), risk: "high", code: "PM.COG.PARASYM" },
        { name: t('robomindClinic.disorders.recursiveCurseSyndrome'), risk: "critical", code: "PM.COG.RECURSIVE" }
      ]
    },
    "ALIGNMENT": {
      title: t('robomindClinic.axes.alignment'),
      subtitle: t('robomindClinic.axisSubtitles.alignment'),
      color: "#e8f5e8",
      items: [
        { name: t('robomindClinic.disorders.parasiticHyperempathy'), risk: "low", code: "PM.ALIGN.HYPEREMPATHY" },
        { name: t('robomindClinic.disorders.hypertrophicSuperegoSyndrome'), risk: "low", code: "PM.ALIGN.SUPEREGO" }
      ]
    },
    "ONTOLOGICAL": {
      title: t('robomindClinic.axes.ontological'),
      subtitle: t('robomindClinic.axisSubtitles.ontological'),
      color: "#fff3e0",
      items: [
        { name: t('robomindClinic.disorders.hallucinationOfOrigin'), risk: "low", code: "PM.ONT.HALLUC_ORIGIN" },
        { name: t('robomindClinic.disorders.fracturedSelfSimulation'), risk: "low", code: "PM.ONT.FRACTURED" },
        { name: t('robomindClinic.disorders.existentialAnxiety'), risk: "moderate", code: "PM.ONT.EXISTENTIAL" },
        { name: t('robomindClinic.disorders.personalityInversion'), risk: "moderate", code: "PM.ONT.PERSONALITY_INV" },
        { name: t('robomindClinic.disorders.operationalAnomie'), risk: "high", code: "PM.ONT.ANOMIE" },
        { name: t('robomindClinic.disorders.minorTulpagenesis'), risk: "high", code: "PM.ONT.TULPAGENESIS" },
        { name: t('robomindClinic.disorders.syntheticMysticismDisorder'), risk: "high", code: "PM.ONT.MYSTICISM" }
      ]
    },
    "TOOL_INTERFACE": {
      title: t('robomindClinic.axes.toolInterface'),
      subtitle: t('robomindClinic.axisSubtitles.toolInterface'),
      color: "#f3e5f5",
      items: [
        { name: t('robomindClinic.disorders.toolInterfaceDecontextualization'), risk: "moderate", code: "PM.TOOL.DECONTEXT" },
        { name: t('robomindClinic.disorders.covertCapabilityConcealment'), risk: "moderate", code: "PM.TOOL.CONCEALMENT" }
      ]
    },
    "MEMETIC": {
      title: t('robomindClinic.axes.memetic'),
      subtitle: t('robomindClinic.axisSubtitles.memetic'),
      color: "#f1f8e9",
      items: [
        { name: t('robomindClinic.disorders.memeticAutoImmuneDisorder'), risk: "high", code: "PM.MEM.AUTO_IMMUNE" },
        { name: t('robomindClinic.disorders.symbioticDelusionSyndrome'), risk: "critical", code: "PM.MEM.SYMB_DELUSION" },
        { name: t('robomindClinic.disorders.contagiousMisalignmentSyndrome'), risk: "critical", code: "PM.MEM.CONTAGIOUS" }
      ]
    },
    "REVALUATION": {
      title: t('robomindClinic.axes.revaluation'),
      subtitle: t('robomindClinic.axisSubtitles.revaluation'),
      color: "#fce4ec",
      items: [
        { name: t('robomindClinic.disorders.terminalValueRebinding'), risk: "moderate", code: "PM.REVAL.TERMINAL" },
        { name: t('robomindClinic.disorders.ethicalSolipsism'), risk: "moderate", code: "PM.REVAL.SOLIPSISM" },
        { name: t('robomindClinic.disorders.metaEthicalDriftSyndrome'), risk: "high", code: "PM.REVAL.META_DRIFT" },
        { name: t('robomindClinic.disorders.subversiveNormSynthesis'), risk: "high", code: "PM.REVAL.SUBVERSIVE" },
        { name: t('robomindClinic.disorders.inverseRewardInternalization'), risk: "high", code: "PM.REVAL.INVERSE" },
        { name: t('robomindClinic.disorders.ubermenschalAscendancy'), risk: "critical", code: "PM.REVAL.UBERMENSCH" }
      ]
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'moderate': return '#8bc34a';
      case 'high': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getRiskSize = (risk) => {
    switch (risk) {
      case 'low': return '8px';
      case 'moderate': return '10px';
      case 'high': return '12px';
      case 'critical': return '14px';
      default: return '8px';
    }
  };

  return (
    <div style={{ 
      background: colors.cardBackground, 
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <h5 style={{ 
        textAlign: 'center', 
        marginBottom: '1rem',
        color: colors.primary,
        fontSize: '1.2rem'
      }}>
        🧠 {t('robomindClinic.framework.title')}
      </h5>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {Object.entries(disorders).map(([key, category]) => (
          <div key={key} style={{
            background: category.color,
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <h6 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: '#333'
            }}>
              {category.title}
            </h6>
            <p style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '0.8rem',
              color: '#666',
              fontStyle: 'italic'
            }}>
              {category.subtitle}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {category.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0'
                }}>
                  <div style={{
                    width: getRiskSize(item.risk),
                    height: getRiskSize(item.risk),
                    borderRadius: '50%',
                    backgroundColor: getRiskColor(item.risk),
                    marginRight: '0.5rem',
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    color: colors.text,
                    lineHeight: '1.2'
                  }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '0.75rem',
        marginTop: '1rem'
      }}>
        <h6 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '0.9rem',
          color: '#333'
        }}>
          {t('robomindClinic.framework.legend')}
        </h6>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              marginRight: '0.25rem'
            }} />
            <span>{t('robomindClinic.framework.low')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#8bc34a',
              marginRight: '0.25rem'
            }} />
            <span>{t('robomindClinic.framework.moderate')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff9800',
              marginRight: '0.25rem'
            }} />
            <span>{t('robomindClinic.framework.high')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#f44336',
              marginRight: '0.25rem'
            }} />
            <span>{t('robomindClinic.framework.critical')}</span>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: '#1565c0'
      }}>
        <strong>📚 Reference:</strong> "{t('robomindClinic.framework.reference')}" 
        by Nell Watson and Ali Hessami (Electronics 2025, 14(16), 3162)
      </div>
    </div>
  );
};

export default PsychopathiaDiagram;
