import { MIN_PASSWORD_LENGTH } from "@/auth/password";

export type StaffCreateIssue = "name" | "username" | "short" | "confirm" | "role" | "duplicate";

export function staffCreateProblems(input: {
  name: string;
  username: string;
  password: string;
  confirmation: string;
  roleAllowed: boolean;
}): StaffCreateIssue | null {
  if (!input.name.trim()) return "name";
  if (input.username.trim().length < 2) return "username";
  if (input.password.length < MIN_PASSWORD_LENGTH) return "short";
  if (input.password !== input.confirmation) return "confirm";
  if (!input.roleAllowed) return "role";
  return null;
}

export function staffCreateMessage(issue: StaffCreateIssue): string {
  if (issue === "name") return "Enter the person's name.";
  if (issue === "username") return "Enter a username of at least 2 characters.";
  if (issue === "short") return "The password must be at least 8 characters.";
  if (issue === "confirm") return "Enter the same password in both password fields.";
  if (issue === "duplicate") return "That username is already in use. Choose a different one.";
  return "Choose Super Admin, Clinic Admin, or Content Editor.";
}
