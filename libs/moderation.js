const bannedWords = [
  "fuck",
  "sex",
  "love",
  "bitch",
  "shit",
  "whatsapp",
  "instagram",
  "telegram",
  "snapchat",
  "dm me",
  "call me",
  "message me",
  "text me",
  "contact me",
  "private message",
  "direct message",
  "phone number",
  "email me",
  "reach me",
  "hook up",
  "meet up",
];

/* ================= PHONE NUMBER REGEX ================= */
// Matches:
// +2348012345678, 08012345678, 0812 345 6789, 090-123-45678, 2348012345678
const phoneRegex =
  /(\+?\d{1,3})?[\s\-\.]?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/;

export function violatesRules(text) {
  const lower = text.toLowerCase();

  // Banned words check
  for (const word of bannedWords) {
    if (lower.includes(word)) {
      return { violation: true, reason: "banned_word" };
    }
  }

  // Phone number check
  phoneRegex.lastIndex = 0; // reset regex state
  if (phoneRegex.test(text)) {
    return { violation: true, reason: "phone_number" };
  }

  return { violation: false };
}
