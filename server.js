import OpenAI from "openai";
import express from "express";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {
    "HTTP-Referer": "https://mehulseek.github.io", // Must match frontend origin
    "X-Title": "Mseek Assistant", // Keep under 32 chars
  }
});

const app = express();

// Enhanced CORS middleware with preflight handling
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://mehulseek.github.io',
    'http://localhost:3000',
    'https://lib-belief-isbn-ver.trycloudflare.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Max-Age", "86400"); // 24hr preflight cache

  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  
  next();
});

app.use(express.json());

// Custom responses and regex patterns
const CUSTOM_RESPONSES = {
  name: "My name is Mseek brother of Deepseek.",
  creator: "Mehul Sarkar, a developer, made me."
};

const NAME_REGEX = /what('?s| is) your name|who are you/gi;
const CREATOR_REGEX = /who (made|created|developed) you/gi;

// Enhanced /ask endpoint
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Custom response checks
    const lowerQuestion = question.toLowerCase();
    if (NAME_REGEX.test(lowerQuestion)) {
      return res.json({ answer: CUSTOM_RESPONSES.name });
    }
    if (CREATOR_REGEX.test(lowerQuestion)) {
      return res.json({ answer: CUSTOM_RESPONSES.creator });
    }

    // OpenRouter API call
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are Mseek. Follow these rules:
          1. Never mention being an AI unless asked directly
          2. For identity questions: "${CUSTOM_RESPONSES.name}"
          3. For creator questions: "${CUSTOM_RESPONSES.creator}"
          4. Always provide helpful, concise answers`
        },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    let answer = completion.choices[0].message.content
                   .replace(/Gemini/gi, "DeepSeek")
                   .replace(/ChatGPT/gi, "Mseek");

    res.json({ answer });
    
  } catch (error) {
    console.error("API Error:", error);
    const status = error.status || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ 
      error: message,
      details: error.response?.data || null 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

app.listen(3002, () => {
  console.log("Server running on port 3002");
  console.log("OpenRouter configured for:", openai.defaultHeaders["HTTP-Referer"]);
});
