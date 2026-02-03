import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function checkAbuse(text) {
  const res = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `Is this message abusive, insulting, sexual, or inappropriate for an academic community? Reply ONLY yes or no.\n\n"${text}"`
  });

  const answer = res.output_text.toLowerCase();
  return answer.includes("yes");
}