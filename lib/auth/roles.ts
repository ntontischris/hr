import { z } from "zod/v4";

export const RoleSchema = z.enum(["employee", "hr_manager", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

const HR_MANAGER_EMAILS = (process.env.HR_MANAGER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function resolveUserRole(email: string): Role {
  if (HR_MANAGER_EMAILS.includes(email.toLowerCase())) {
    return "hr_manager";
  }
  return "employee";
}
