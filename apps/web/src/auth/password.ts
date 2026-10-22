import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const MIN_PASSWORD_LENGTH = 8;

export function passwordProblems(password: string, confirmation: string): "short" | "mismatch" | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "short";
  if (password !== confirmation) return "mismatch";
  return null;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}
