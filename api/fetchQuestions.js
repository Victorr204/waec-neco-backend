const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";
const ALOC_TOKEN = process.env.ALOC_API_TOKEN;

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
      return res.status(response.status).json({
        message: "ALOC API error",
        error: data,
      });
    }

    const questions = data.data;

    if (!questions || questions.length === 0) {
      return res.status(200).json([]);
    }

    // Format for your frontend
    const formatted = questions.map((q, index) => ({
      id: index + 1,
      subject,
      exam: examType.toUpperCase(),
      year,
      text: q.question,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      answer: q.answer,
      isTest: false,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}
