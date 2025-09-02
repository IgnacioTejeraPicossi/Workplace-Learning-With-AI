import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

export default function TopBarLanguageMenu() {
  const { t } = useTranslation('common');
  const [lng, setLng] = useState(i18n.language?.slice(0,2) || 'en');
  const [isOpen, setIsOpen] = useState(false);
  const [useTextFallback, setUseTextFallback] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = () => setLng(i18n.language?.slice(0,2) || 'en');
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Test if flag emojis render correctly
  useEffect(() => {
    const testFlag = document.createElement('span');
    testFlag.textContent = '🇬🇧';
    testFlag.style.position = 'absolute';
    testFlag.style.left = '-9999px';
    document.body.appendChild(testFlag);
    
    // Check if the flag renders as a single character (good) or multiple characters (bad)
    const flagWidth = testFlag.offsetWidth;
    document.body.removeChild(testFlag);
    
    // If flag is too wide, it means it's not rendering as a single emoji
    if (flagWidth > 20) {
      setUseTextFallback(true);
    }
  }, []);

  const changeLanguage = (newLng) => {
    i18n.changeLanguage(newLng);
    localStorage.setItem('i18nextLng', newLng); // persist choice
    document.documentElement.lang = newLng;     // good for a11y/SEO
    setIsOpen(false);
  };

  const getFlag = (lang) => {
    if (useTextFallback) {
      return lang === 'no' ? '[NO]' : '[GB]';
    }
    // Try different flag representations for better browser compatibility
    if (lang === 'no') {
      return '🇳🇴'; // Norwegian flag
    } else {
      return '🇬🇧'; // UK flag
    }
  };

  const getLanguageName = (lang) => {
    return lang === 'no' ? t('norwegian') : t('english');
  };

  return (
    <div className="language-menu" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e1e5e9',
          backgroundColor: 'white',
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>{getFlag(lng)}</span>
          <span>{getLanguageName(lng)}</span>
        </span>
        <span style={{ fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            marginTop: '4px'
          }}
        >
          <button
            onClick={() => changeLanguage('en')}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              backgroundColor: lng === 'en' ? '#f0f0f0' : 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '6px 6px 0 0'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{getFlag('en')}</span>
              <span>{t('english')}</span>
            </span>
          </button>
          <button
            onClick={() => changeLanguage('no')}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              backgroundColor: lng === 'no' ? '#f0f0f0' : 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '0 0 6px 6px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{getFlag('no')}</span>
              <span>{t('norwegian')}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
