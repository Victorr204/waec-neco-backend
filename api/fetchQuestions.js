const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    // ✅ Vercel automatically parses JSON body
    const { subject, year, examType } = req.body;

    if (!subject || !year || !examType) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const ALOC_TOKEN = process.env.ALOC_API_TOKEN;

    if (!ALOC_TOKEN) {
      return res.status(500).json({ message: "ALOC token not configured" });
    }

    const queryParams = new URLSearchParams({
      subject,
      year: String(year),
      type: examType,
    });

    const url = `${ALOC_API_URL}?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ALOC_TOKEN}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: "ALOC API error",
        error: data,
      });
    }

    const questions = data.data || [];

    const formatted = questions.map((q, index) => ({
      id: index + 1,
      subject,
      exam: examType.toUpperCase(),
      year,
      text: q.question || "No text provided",
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      answer: q.answer,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("FetchQuestions Server Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
