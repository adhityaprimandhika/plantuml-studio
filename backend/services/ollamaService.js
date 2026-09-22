const axios = require("axios");

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "gemma2:2b";

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
    "in plain language, the logic/flow/structure it represents.\n\n" +
    "IMPORTANT STRIKETHROUGH INSTRUCTIONS:\n" +
    "- Text enclosed in <s>...</s> tags represents LOGIC THAT HAS BEEN DELETED OR REPLACED.\n" +
    "- Always explicitly identify <s>...</s> items as removed, legacy, or superseded logic.\n" +
    "- If a non-strikethrough element appears directly alongside or after a <s>...</s> element, explain it as the NEW or REPLACEMENT logic.\n" +
    "- Be concise but complete using short paragraphs or bullet points. Do not restate raw syntax.";

  const prompt = `Summarize the logic and flow represented by this PlantUML diagram, paying special attention to any deleted/replaced logic inside <s>...</s> tags:\n\n${plantumlCode}`;
  return generate(prompt, { system, model: DEFAULT_MODEL });
}

async function summarizeColorGroup(color, lines) {
  const system =
    "You are a senior software architect reviewing a PlantUML diagram. You are analyzing lines " +
    "sharing a specific color annotation.\n\n" +
    "IMPORTANT STRIKETHROUGH INSTRUCTIONS:\n" +
    "- Text enclosed in <s>...</s> represents DELETED, REPLACED, or DEPRECATED elements.\n" +
    "- If <s>...</s> tags are present, clearly explain what original logic was removed/replaced and what active logic takes its place.\n" +
    "- Keep explanations to 2-4 specific sentences focusing on what this group represents.";

  const prompt =
    `Color: ${color}\n\nRelevant PlantUML lines:\n${lines.join("\n")}\n\n` +
    `Explain what this colored group represents, highlighting any deleted or replaced logic marked with <s>...</s> tags.`;
  return generate(prompt, { system, model: DEFAULT_MODEL });
}

module.exports = {
  generate,
  summarizeLogic,
  summarizeColorGroup,
};
