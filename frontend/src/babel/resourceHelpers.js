// Babel Library — self-contained, pure resource helpers.
// Extracted from BabelLibrary.jsx (audit Fase 3, step 1) to shrink that file and
// keep pure, testable presentation logic + illustrative seed data in one place.
// Everything here is pure/stateless (no React, no i18n, no theme).

// Illustrative sample content seeded when the local catalog is empty. Kept for a
// non-empty first impression, but always rendered with a "Sample" badge so it is
// never mistaken for real library resources.
export const DEMO_BOOKS = [
  { id: 1, title: "The Art of Artificial Intelligence", author: "Dr. Sarah Chen", topic: "AI & Machine Learning", description: "Comprehensive guide to modern AI techniques and applications", type: "book", addedDate: "2024-01-15", isDemo: true },
  { id: 2, title: "Digital Transformation Strategies", author: "Prof. Michael Rodriguez", topic: "Business Strategy", description: "How organizations can successfully navigate digital transformation", type: "book", addedDate: "2024-01-10", isDemo: true },
  { id: 3, title: "Future of Work: AI Integration", author: "Dr. Emily Watson", topic: "Workplace Innovation", description: "Exploring how AI will reshape the modern workplace", type: "book", addedDate: "2024-01-05", isDemo: true },
  { id: 4, title: "Machine Learning Fundamentals", author: "Prof. David Kim", topic: "AI & Machine Learning", description: "Core concepts and practical applications of ML", type: "video", addedDate: "2024-01-20", isDemo: true },
  { id: 5, title: "Leadership in the Digital Age", author: "Dr. Lisa Thompson", topic: "Leadership", description: "Essential leadership skills for the technology-driven era", type: "article", addedDate: "2024-01-12", isDemo: true },
];

// Authors of the seed data — used to detect demo entries persisted to
// localStorage before the `isDemo` flag existed.
export const DEMO_AUTHORS = new Set(DEMO_BOOKS.map(b => b.author));

export const isDemoResource = (resource) =>
  !!(resource && (resource.isDemo || DEMO_AUTHORS.has(resource.author)));

export const getTypeIcon = (type) => {
  switch (type) {
    case 'book': return '📚';
    case 'video': return '🎥';
    case 'article': return '📄';
    case 'course': return '🎓';
    case 'simulation': return '🎮';
    case 'analysis': return '📊';
    default: return '📖';
  }
};

export const getTypeColor = (type) => {
  switch (type) {
    case 'book': return '#007bff';
    case 'video': return '#28a745';
    case 'article': return '#ffc107';
    case 'course': return '#6f42c1';
    case 'simulation': return '#fd7e14';
    case 'analysis': return '#17a2b8';
    default: return '#6c757d';
  }
};
