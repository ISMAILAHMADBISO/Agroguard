const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-or-v1-fake-just-to-instantiate",
  baseURL: "https://openrouter.ai/api/v1"
});

async function test() {
  try {
    const response = await client.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages: [{ role: "user", content: "Hello" }]
    });
    console.log("Success:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
