import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { fetchSavedVideos, deleteSavedVideo, updateSavedVideo } from './api';

function SavedVideos({ user }) {
  const { t } = useTranslation('common');
  const [savedVideos, setSavedVideos] = useState([]);
  const [filter, setFilter] = useState('');
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoExpandTarget, setAutoExpandTarget] = useState(null);
  const { colors } = useTheme();

  // Load saved videos from API
  const loadSavedVideos = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedVideos();
      setSavedVideos(data.videos || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSavedVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSavedVideos();
    } else {
      setLoading(false);
      setSavedVideos([]);
    }
  }, [user]);

  // Navigation intelligence from Babel Library
  useEffect(() => {
    // Check for navigation instructions from Babel Library
    const checkNavigationInstructions = () => {
      const targetPage = localStorage.getItem('targetPage');
      const action = localStorage.getItem('action');
      const resourceId = localStorage.getItem('editResourceId');
      const resourceTitle = localStorage.getItem('editResourceTitle');
      const autoExpand = localStorage.getItem('autoExpand');
      
      console.log(`🔍 [Video Lessons] Checking for navigation instructions:`, {
        targetPage,
        action,
        resourceId,
        resourceTitle,
        autoExpand
      });
      
      if (targetPage && action && resourceId) {
        console.log(`🎯 [Video Lessons] Navigation instructions found:`, {
          targetPage,
          action,
          resourceId,
          resourceTitle,
          autoExpand
        });
        
        // If autoExpand is enabled, find and expand the specific video
        if (autoExpand === 'true' && resourceTitle) {
          // Set a flag to auto-expand after videos are loaded
          setAutoExpandTarget({ id: resourceId, title: resourceTitle });
        }
        
        // Clear the navigation instructions from localStorage
        localStorage.removeItem('targetPage');
        localStorage.removeItem('editResourceId');
        localStorage.removeItem('editResourceTitle');
        localStorage.removeItem('autoExpand');
        
        console.log(`🧹 [Video Lessons] Navigation instructions cleared from localStorage`);
      } else {
        console.log(`ℹ️ [Video Lessons] No navigation instructions found in localStorage`);
      }
    };
    
    // Check for navigation instructions after a short delay to ensure component is fully loaded
    const timer = setTimeout(checkNavigationInstructions, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Listen for video saved events to refresh the list
  useEffect(() => {
    const handleVideoSaved = () => {
      if (user) {
        loadSavedVideos();
      }
    };

    window.addEventListener('videoSaved', handleVideoSaved);
    
    return () => {
      window.removeEventListener('videoSaved', handleVideoSaved);
    };
  }, [user]);

  // Auto-expand specific video when videos are loaded
  useEffect(() => {
    if (autoExpandTarget && savedVideos.length > 0) {
      console.log(`🔍 [Video Lessons] Looking for video to auto-expand:`, autoExpandTarget);
      
      // Find the video by title (more reliable than ID)
      const targetVideo = savedVideos.find(video => 
        video.title.toLowerCase().includes(autoExpandTarget.title.toLowerCase()) ||
        autoExpandTarget.title.toLowerCase().includes(video.title.toLowerCase())
      );
      
      if (targetVideo) {
        console.log(`✅ [Video Lessons] Found video to expand:`, targetVideo);
        
        // Expand the video
        setExpandedVideo(targetVideo._id);
        
        // Show success message briefly
        console.log(`✅ [Video Lessons] Automatically expanded: "${targetVideo.title}"`);
        
        // Scroll to the video after a short delay
        setTimeout(() => {
          const videoElement = document.querySelector(`[data-video-id="${targetVideo._id}"]`);
          if (videoElement) {
            videoElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 100);
        
        // Clear the auto-expand target
        setAutoExpandTarget(null);
      }
    }
  }, [savedVideos, autoExpandTarget]);

  const filteredVideos = savedVideos.filter(video =>
    video.title.toLowerCase().includes(filter.toLowerCase()) ||
    video.topic.toLowerCase().includes(filter.toLowerCase())
  );

  const handlePlay = (video) => {
    // Open video in new tab or modal
    window.open(video.url, '_blank');
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm(t('savedVideos.deleteConfirm'))) return;
    try {
      await deleteSavedVideo(videoId);
      await loadSavedVideos();
      
      // Emit videoUpdated event for Dashboard refresh
      const updateEvent = new CustomEvent('videoUpdated');
      window.dispatchEvent(updateEvent);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleShare = (video) => {
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: video.url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${video.title}: ${video.url}`);
      alert(t('savedVideos.linkCopied'));
    }
  };

  const handleDownload = (video) => {
    // Download functionality (mock)
    alert(`${t('savedVideos.downloading')} ${video.title}`);
  };

  const handleAddToPlaylist = (video) => {
    // Add to playlist functionality (mock)
    alert(`${t('savedVideos.addedToPlaylist')} ${video.title}`);
  };

  const toggleExpand = (videoId) => {
    setExpandedVideo(expandedVideo === videoId ? null : videoId);
  };

  if (loading) return <div>{t('savedVideos.loading')}</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '2rem', color: colors.text }}>{t('savedVideos.title')}</h2>
        
        {/* Navigation status message */}
        {autoExpandTarget && (
          <div style={{ 
            background: colors.primaryLight, 
            color: colors.primary, 
            padding: "12px 16px", 
            borderRadius: 8, 
            marginBottom: 16,
            border: `1px solid ${colors.primary}`,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎯 <strong>{t('savedVideos.navigatingTo')}</strong> "{autoExpandTarget.title}" - {t('savedVideos.expandingAuto')}
          </div>
        )}
      
      {/* Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={t('savedVideos.filterPlaceholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            flex: 1,
            maxWidth: '300px'
          }}
        />
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {t('savedVideos.clear')}
        </button>
      </div>

      {/* Video List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredVideos.map(video => (
          <div
            key={video._id}
            data-video-id={video._id}
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: colors.shadow
            }}
          >
                                      <div style={{
               display: 'flex',
               flexWrap: 'wrap',
               gap: '1rem',
               alignItems: 'start',
               justifyContent: 'space-between',
               width: '100%'
             }}>
               <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                 <h3
                   title={video.title}
                   style={{
                     margin: '0 0 0.5rem 0', color: colors.text,
                     // Clamp long titles (e.g. TikTok captions) to 2 lines so a
                     // long caption can't stretch the card into a tall strip.
                     display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                     overflow: 'hidden', wordBreak: 'break-word',
                   }}
                 >
                   🎥 {video.title}
                 </h3>
                 <p style={{ margin: '0 0 0.5rem 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                   {t('savedVideos.duration')} {video.duration} | {t('savedVideos.topic')} {video.topic}
                 </p>
               </div>
               
               <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                <button
                  onClick={() => handlePlay(video)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  ▶️ {t('savedVideos.play')}
                </button>
                
                <button
                  onClick={() => toggleExpand(video._id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {expandedVideo === video._id ? `📁 ${t('savedVideos.compress')}` : `📂 ${t('savedVideos.expand')}`}
                </button>
                
                <button
                  onClick={() => handleShare(video)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  📤 {t('savedVideos.share')}
                </button>
                
                <button
                  onClick={() => handleDownload(video)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  ⬇️ {t('savedVideos.download')}
                </button>
                
                <button
                  onClick={() => handleAddToPlaylist(video)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  📋 {t('savedVideos.addToPlaylist')}
                </button>
                
                <button
                  onClick={() => handleDelete(video._id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  🗑️ {t('savedVideos.delete')}
                </button>
                             </div>
             </div>
             
             {/* Video expandido fuera del grid para ocupar todo el ancho */}
             {expandedVideo === video._id && (
               <div style={{ 
                 marginTop: '1rem',
                 padding: '1rem',
                 background: colors.cardBackground,
                 borderRadius: '8px',
                 border: `1px solid ${colors.border}`,
                 width: '100%'
               }}>
                 <p style={{ color: colors.text, lineHeight: 1.5, marginBottom: '1rem' }}>
                   {video.description}
                 </p>
                 <div style={{ 
                   marginTop: '1rem',
                   position: 'relative',
                   overflow: 'hidden',
                   width: '100%'
                 }}>
                   <iframe
                     width="100%"
                     height="400"
                     src={video.url}
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                     title={video.title}
                     style={{
                       borderRadius: '8px',
                       boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                       display: 'block',
                       width: '100%',
                       minWidth: '100%'
                     }}
                   ></iframe>
                 </div>
               </div>
             )}
           </div>
         ))}
       </div>

      {filteredVideos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: colors.textSecondary }}>
          {filter ? t('savedVideos.noMatch') : t('savedVideos.empty')}
        </div>
      )}
    </div>
  );
}

export default SavedVideos; 