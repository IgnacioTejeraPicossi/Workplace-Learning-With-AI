const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.WEBSEARCH_PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Web Search endpoint
app.post('/web-search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Web search request: ${query}`);

    // Try to use web search tool if available
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.4-mini",
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        tools: [
          {
            type: "web_search"
          }
        ],
        tool_choice: "auto"
      });

      const result = response.choices[0].message;
      
      // Check if web search was used
      if (result.tool_calls && result.tool_calls.length > 0) {
        console.log('Web search tool used successfully');
        return res.json({
          result: result.content,
          used_web_search: true,
          tool_calls: result.tool_calls
        });
      } else {
        // Fallback to standard response
        console.log('Web search tool not available, using standard response');
        return res.json({
          result: result.content,
          used_web_search: false,
          message: 'Web search tool not available, using standard AI response'
        });
      }

    } catch (webSearchError) {
      console.log('Web search failed, falling back to standard response:', webSearchError.message);
      
      // Fallback to standard GPT response.
      // NB: GPT-5 family uses `max_completion_tokens` (not `max_tokens`).
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-5.4-mini",
        messages: [
          {
            role: "user",
            content: `Please provide a comprehensive answer to: ${query}. If this is about current events or recent information, please note that I may not have the most up-to-date information.`
          }
        ],
        max_completion_tokens: 1000
      });

      return res.json({
        result: fallbackResponse.choices[0].message.content,
        used_web_search: false,
        message: 'Web search tool not available, using standard AI response',
        error: webSearchError.message
      });
    }

  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      used_web_search: false
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Web Search Backend',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Web Search Backend is running',
    endpoints: {
      'POST /web-search': 'Perform web search with AI',
      'GET /health': 'Health check'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Web Search Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Web search endpoint: http://localhost:${PORT}/web-search`);
}); 