import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, options, correctAnswer } = req.body;

  if (!question || !correctAnswer) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const prompt = `
You are a Exam Sharp School examiner.
Explain this ${exam} ${subject} question clearly for a student.

Question:
${question}

Options:
${options?.join(", ") || "None"}

Correct Answer:
${correctAnswer}

Explain clearly why this answer is correct in simple student-friendly language.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a Exam Sharp School teacher." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
    });

    res.status(200).json({
      explanation: completion.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({ error: "AI explanation failed" });
  }
}
