const axios = require("axios");

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3:8b";

/**
 * Calls Ollama's /api/chat endpoint (non-streaming) with a given prompt.
 * /api/chat is used rather than /api/generate because some newer model
 * families (e.g. instruction-tuned or multimodal models) only implement
 * the chat interface and reject raw completion requests.
 */
async function generate(
  prompt,
  { model = DEFAULT_MODEL, system, temperature = 0.2 } = {},
) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  try {
    const res = await axios.post(
      `${BASE_URL}/api/chat`,
      {
        model,
        messages,
        stream: false,
        options: { temperature },
      },
      { timeout: 120000 },
    );
    return res.data.message?.content?.trim() || "";
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    throw new Error(`Ollama request failed (model="${model}"): ${detail}`);
  }
}

async function summarizeLogic(plantumlCode) {
  const system =
    "You are a senior software architect. You read PlantUML diagram source code and explain, " +
    "in plain language, the logic/flow/structure it represents. Be concise but complete. " +
    "Use short paragraphs or a bullet list. Do not restate raw PlantUML syntax back to the user.";
  const prompt = `Summarize the logic and flow represented by this PlantUML diagram:\n\n${plantumlCode}`;
  return generate(prompt, { system, model: DEFAULT_MODEL });
}

async function summarizeColorGroup(color, lines) {
  const system =
    "You are a senior software architect reviewing a PlantUML diagram. You will be given the lines " +
    "of the diagram that share a specific color annotation. Explain, in 2-4 sentences, what this " +
    "colored group of elements represents and explain how or what the logic shown. Be specific to the content given.";
  const prompt =
    `Color: ${color}\n\nRelevant PlantUML lines:\n${lines.join("\n")}\n\n` +
    `Explain what this colored group represents.`;
  return generate(prompt, { system, model: DEFAULT_MODEL });
}

module.exports = {
  generate,
  summarizeLogic,
  summarizeColorGroup,
};
