const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";
const ALOC_TOKEN = process.env.ALOC_API_TOKEN;

export default async function handler(req, res) {
  // 🌍 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // ✅ Vercel auto-parses JSON body
    const { subject, year, examType } = req.body;

    if (!subject || !year || !examType) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    if (!ALOC_TOKEN) {
      console.error("❌ ALOC TOKEN MISSING");
      return res.status(500).json({ message: "ALOC token not configured" });
    }

    const queryParams = new URLSearchParams({
      subject,
      year: String(year),
      type: examType,
    });

    const url = `${ALOC_API_URL}?${queryParams.toString()}`;
    console.log("📡 Fetching from ALOC:", url);

    // ✅ CORRECT AUTH FORMAT FOR ALOC
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: ALOC_TOKEN, // 🚫 NO Bearer
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ ALOC ERROR RESPONSE:", data);
      return res.status(response.status).json({
        message: "ALOC API responded with error",
        error: data,
      });
    }

    const questions = data.data || [];

    if (questions.length === 0) {
      return res.status(200).json([]);
    }

    // 🎯 Format for frontend
    const formatted = questions.map((q, index) => ({
      id: `${subject}-${year}-${index}`,
      subject,
      exam: examType.toUpperCase(),
      year,
      text: q.question || "No question text",
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      answer: q.answer || null,
      isTest: false,
    }));

    console.log(`✅ Returning ${formatted.length} questions`);

    return res.status(200).json(formatted);

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}
