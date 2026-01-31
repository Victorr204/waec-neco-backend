const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const { subject, year, examType } = req.body || {};
    console.log("Incoming body:", req.body);

    // Validate input
    if (!subject || !year || !examType) {
      return res.status(400).json({
        message: "Missing parameters",
        required: ["subject", "year", "examType"],
      });
    }

    const token = process.env.ALOC_API_TOKEN;
    if (!token) {
      return res.status(500).json({ message: "ALOC token not configured" });
    }

    // 🔥 ALOC requires uppercase type
    const queryParams = new URLSearchParams({
      subject: subject.trim(),
      year: String(year),
      type: examType.toUpperCase(),
    });

    console.log("Fetching from ALOC:", `${ALOC_API_URL}?${queryParams}`);

    const alocRes = await fetch(`${ALOC_API_URL}?${queryParams}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: token, // ALOC format (NO Bearer)
      },
    });

    const rawText = await alocRes.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("ALOC returned non-JSON:", rawText);
      return res.status(502).json({ message: "Invalid response from ALOC" });
    }

    if (!alocRes.ok) {
      console.error("ALOC ERROR:", data);
      return res.status(alocRes.status).json({
        message: "ALOC request failed",
        alocError: data,
      });
    }

    if (!data.data || !Array.isArray(data.data)) {
      return res.status(404).json({ message: "No questions found" });
    }

    // ✅ Normalize questions for frontend
    const formatted = data.data.map((q, i) => ({
      id: `${year}-${i + 1}`,
      subject,
      exam: examType.toUpperCase(),
      year: Number(year),
      question: q.question || "",
      options: [
        { key: "A", text: q.option_a || "" },
        { key: "B", text: q.option_b || "" },
        { key: "C", text: q.option_c || "" },
        { key: "D", text: q.option_d || "" },
      ],
      correctAnswer: q.answer || null,
      explanation: q.solution || null,
    }));

    console.log(`Returning ${formatted.length} questions`);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      questions: formatted,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}
