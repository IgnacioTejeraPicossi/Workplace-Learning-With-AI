import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

/**
 * Babel Library — "Add Resource" tab (extracted from BabelLibrary.jsx, Fase 3).
 * Presentational form; the parent owns the `newBook` state and the submit
 * handler so the aggregated catalog logic stays in one place.
 *
 * Props: newBook, setNewBook, onSubmit (the parent's handleAddBook).
 */
export default function AddResourceTab({ newBook, setNewBook, onSubmit }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const fieldStyle = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: '1em',
    background: colors.background,
    color: colors.text,
  };
  const labelStyle = { display: 'block', marginBottom: 8, color: colors.text, fontWeight: '500' };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ color: colors.text, marginBottom: 24 }}>{t('babelLibraryModule.addForm.title')}</h2>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{t('babelLibraryModule.addForm.resourceType')}</label>
          <select
            value={newBook.type}
            onChange={(e) => setNewBook({ ...newBook, type: e.target.value })}
            style={fieldStyle}
          >
            <option value="book">{t('babelLibraryModule.addForm.typeBook')}</option>
            <option value="video">{t('babelLibraryModule.addForm.typeVideo')}</option>
            <option value="article">{t('babelLibraryModule.addForm.typeArticle')}</option>
            <option value="course">{t('babelLibraryModule.addForm.typeCourse')}</option>
            <option value="analysis">{t('babelLibraryModule.addForm.typeAnalysis')}</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{t('babelLibraryModule.addForm.fieldTitle')}</label>
          <input
            type="text"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder={t('babelLibraryModule.addForm.placeholderTitle')}
            style={fieldStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{t('babelLibraryModule.addForm.fieldAuthor')}</label>
          <input
            type="text"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            placeholder={t('babelLibraryModule.addForm.placeholderAuthor')}
            style={fieldStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{t('babelLibraryModule.addForm.fieldTopic')}</label>
          <input
            type="text"
            value={newBook.topic}
            onChange={(e) => setNewBook({ ...newBook, topic: e.target.value })}
            placeholder={t('babelLibraryModule.addForm.placeholderTopic')}
            style={fieldStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('babelLibraryModule.addForm.fieldDescription')}</label>
          <textarea
            value={newBook.description}
            onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
            placeholder={t('babelLibraryModule.addForm.placeholderDescription')}
            rows={4}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </div>

        {newBook.type === 'video' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('babelLibraryModule.addForm.fieldVideoUrl')}</label>
            <input
              type="text"
              value={newBook.url}
              onChange={(e) => setNewBook({ ...newBook, url: e.target.value })}
              placeholder={t('babelLibraryModule.addForm.placeholderVideoUrl')}
              style={fieldStyle}
            />
          </div>
        )}

        <button
          type="submit"
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 8,
            fontSize: '1em',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {t('babelLibraryModule.addForm.submit')}
        </button>
      </form>
    </div>
  );
}
