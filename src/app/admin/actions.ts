"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "admin_session";

export async function adminLogin(formData: FormData) {
  const password = formData.get("password") as string;
  if (password === process.env.ADMIN_PASSWORD) {
    const store = await cookies();
    store.set(COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    redirect("/");
  }
  redirect("/admin/login?error=1");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete(COOKIE);
  redirect("/");
}
