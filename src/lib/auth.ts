import { cookies } from "next/headers";

const COOKIE = "admin_session";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "1";
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}
