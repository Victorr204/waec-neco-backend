const ALOC_API_URL = "https://questions.aloc.com.ng/api/v2/q";
const ALOC_TOKEN = process.env.ALOC_API_TOKEN;

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Required for preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Make sure body is parsed
    const { subject, year, examType } = await parseJSONBody(req);

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

    // Fetch from ALOC
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ALOC_TOKEN}` },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: "ALOC API responded with error",
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
      isTest: false,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("📌 fetchQuestions error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Helper to parse JSON body
async function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}
