import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { fetchSavedVideos, deleteSavedVideo, updateSavedVideo } from './api';

function SavedVideos({ user }) {
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
    if (!window.confirm("Delete this video?")) return;
    try {
      await deleteSavedVideo(videoId);
      await loadSavedVideos();
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
      alert('Video link copied to clipboard!');
    }
  };

  const handleDownload = (video) => {
    // Download functionality (mock)
    alert(`Downloading: ${video.title}`);
  };

  const handleAddToPlaylist = (video) => {
    // Add to playlist functionality (mock)
    alert(`Added to playlist: ${video.title}`);
  };

  const toggleExpand = (videoId) => {
    setExpandedVideo(expandedVideo === videoId ? null : videoId);
  };

  if (loading) return <div>Loading saved videos...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '2rem', color: colors.text }}>Saved Videos</h2>
        
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
            🎯 <strong>Navigating to:</strong> "{autoExpandTarget.title}" - Expanding automatically...
          </div>
        )}
      
      {/* Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter by topic..."
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
          Clear
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
               display: 'grid', 
               gridTemplateColumns: '1fr auto',
               gap: '1rem',
               alignItems: 'start',
               width: '100%'
             }}>
               <div style={{ minWidth: 0 }}>
                 <h3 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>
                   🎥 {video.title}
                 </h3>
                 <p style={{ margin: '0 0 0.5rem 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                   Duration: {video.duration} | Topic: {video.topic}
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
                  ▶️ Play
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
                  {expandedVideo === video._id ? '📁 Compress' : '📂 Expand'}
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
                  📤 Share
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
                  ⬇️ Download
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
                  📋 Add to Playlist
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
                  🗑️ Delete
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
          {filter ? 'No videos match your filter.' : 'No saved videos yet.'}
        </div>
      )}
    </div>
  );
}

export default SavedVideos; 