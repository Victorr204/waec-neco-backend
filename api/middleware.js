import jwt from "jsonwebtoken";

export function auth(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("Unauthorized");
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function admin(req) {
  const user = auth(req);
  if (!user.isAdmin) throw new Error("Admin only");
  return user;
}
