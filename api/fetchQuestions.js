import admin from "firebase-admin";
import { db } from "../firebaseAdmin";

const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";
const ALOC_TOKEN = process.env.ALOC_API_TOKEN;

export default async function handler(req, res) {
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

    if (!ALOC_TOKEN) {
      return res.status(500).json({ message: "ALOC token not configured" });
    }

    const queryParams = new URLSearchParams({
      subject,
      year: String(year),
      type: examType,
    });

    const url = `${ALOC_API_URL}?${queryParams.toString()}`;

    console.log("Fetching from ALOC:", url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ALOC_TOKEN}` },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ALOC ERROR:", data);
      return res.status(response.status).json({ message: "ALOC API error", error: data });
    }

    const questions = data.data; // ✅ correct path

    if (!questions || questions.length === 0) {
      return res.status(200).json({ message: "No questions found from ALOC" });
    }

    const batch = db.batch();

    questions.forEach((q) => {
      const ref = db.collection("pastQuestions").doc();

      batch.set(ref, {
        text: q.question || "Question unavailable",
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

        isTest: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return res.status(200).json({
      message: `Saved ${questions.length} questions to Firestore`,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
