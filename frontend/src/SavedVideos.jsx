import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

function SavedVideos({ user }) {
  const [savedVideos, setSavedVideos] = useState([]);
  const [filter, setFilter] = useState('');
  const [expandedVideo, setExpandedVideo] = useState(null);
  const { colors } = useTheme();

  // Mock data for saved videos
  useEffect(() => {
    setSavedVideos([
      {
        id: 1,
        title: "Agile Scrum Basics",
        description: "Learn the fundamentals of Agile methodology and Scrum framework for effective project management.",
        duration: "15:30",
        url: "https://www.youtube.com/embed/9TycLR0TqFA",
        topic: "Agile",
        savedAt: "2025-01-15"
      },
      {
        id: 2,
        title: "Python for Beginners",
        description: "Complete introduction to Python programming language with hands-on examples and exercises.",
        duration: "25:45",
        url: "https://www.youtube.com/embed/kqtD5dpn9C8",
        topic: "Programming",
        savedAt: "2025-01-14"
      },
      {
        id: 3,
        title: "Leadership Communication",
        description: "Master the art of effective communication in leadership roles and team management.",
        duration: "18:20",
        url: "https://www.youtube.com/embed/8jPQjjsBbIc",
        topic: "Leadership",
        savedAt: "2025-01-13"
      },
      {
        id: 4,
        title: "JavaScript Fundamentals",
        description: "Essential JavaScript concepts for web development and modern applications.",
        duration: "22:15",
        url: "https://www.youtube.com/embed/W6NZfCO5SIk",
        topic: "Programming",
        savedAt: "2025-01-12"
      }
    ]);
  }, []);

  const filteredVideos = savedVideos.filter(video =>
    video.title.toLowerCase().includes(filter.toLowerCase()) ||
    video.topic.toLowerCase().includes(filter.toLowerCase())
  );

  const handlePlay = (video) => {
    // Open video in new tab or modal
    window.open(video.url, '_blank');
  };

  const handleDelete = (videoId) => {
    setSavedVideos(savedVideos.filter(video => video.id !== videoId));
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

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', color: colors.text }}>Saved Videos</h2>
      
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
            key={video.id}
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: colors.shadow
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>
                  🎥 {video.title}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                  Duration: {video.duration} | Topic: {video.topic}
                </p>
                
                {expandedVideo === video.id && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ color: colors.text, lineHeight: 1.5 }}>
                      {video.description}
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                      <iframe
                        width="100%"
                        height="200"
                        src={video.url}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.title}
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  onClick={() => toggleExpand(video.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {expandedVideo === video.id ? '📁 Compress' : '📂 Expand'}
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
                  onClick={() => handleDelete(video.id)}
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