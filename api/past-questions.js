// api/past-questions.js
import { db } from "../firebaseAdmin";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const snapshot = await db
      .collection("pastQuestions")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      subject: doc.data().subject,
      exam: doc.data().exam,
      text: doc.data().text,
      isTest: doc.data().isTest,
    }));

    return res.status(200).json(questions);
  } catch (error) {
    console.error("past-questions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
