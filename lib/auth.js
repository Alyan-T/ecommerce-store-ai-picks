import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Reads and verifies the auth token from the request's cookies.
// Returns the decoded payload ({ id, email, name, role }) or null.
export function getUserFromRequest(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
