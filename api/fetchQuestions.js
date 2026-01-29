// api/fetchQuestions.js
import { db } from "../firebaseAdmin";

const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const { subject, year, examType } = req.body;

    if (!subject || !year || !examType) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const url = `${ALOC_API_URL}?subject=${subject}&year=${year}&type=${examType}`;

    const apiRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ALOC_API_TOKEN}`,
      },
    });

    const result = await apiRes.json();

    if (!result?.data?.length) {
      return res.status(200).json({ message: "No questions from ALOC" });
    }

    const batch = db.batch();

    result.data.forEach((q) => {
      const ref = db.collection("pastQuestions").doc();
      batch.set(ref, {
  text: q.question || q.text || "Question unavailable",
  options: {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  },
  answer: q.answer || null,

  subject,
  exam: examType,
  year,

  isTest: false, // important for Home filter
  createdAt: new Date()
});
    });

    await batch.commit();

    return res
      .status(200)
      .json({ message: `Saved ${result.data.length} questions` });
  } catch (error) {
    console.error("fetchQuestions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
