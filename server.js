import OpenAI from "openai";
import express from "express";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "<YOUR_SITE_NAME>",
  }
});

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());

// Custom responses
const CUSTOM_RESPONSES = {
  name: "My name is Mseek brother of Deepseek.",
  creator: "Mehul Sarkar, a developer, made me."
};

// Regex patterns to detect questions
const NAME_REGEX = /what('?s| is) your name|who are you/gi;
const CREATOR_REGEX = /who (made|created|developed) you/gi;

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    
    // Check for custom questions first
    if (NAME_REGEX.test(question)) {
      return res.json({ answer: CUSTOM_RESPONSES.name });
    }
    if (CREATOR_REGEX.test(question)) {
      return res.json({ answer: CUSTOM_RESPONSES.creator });
    }

    // For other questions, use the API with system prompt
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant named Mseek. Follow these rules:
          1. Never mention being an AI assistant unless explicitly asked.
          2. If asked about your identity, say "${CUSTOM_RESPONSES.name}"
          3. If asked about your creator, say "${CUSTOM_RESPONSES.creator}"
          4. For other questions, provide helpful answers.`
        },
        { role: "user", content: question }
      ]
    });

    // Post-process response
    let answer = completion.choices[0].message.content;
    answer = answer.replace(/Gemini/g, "DeepSeek");
    
    res.json({ answer });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
