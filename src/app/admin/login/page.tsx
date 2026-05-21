import { adminLogin, adminLogout } from "@/app/admin/actions";
import { isAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLoginPage() {
  const loggedIn = await isAdmin();

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="bg-white rounded-xl border border-amber-100 p-8">
        <h1 className="text-xl font-bold text-amber-900 mb-6">Admin</h1>

        {loggedIn ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
              You are logged in as admin.
            </p>
            <form action={adminLogout}>
              <button type="submit" className="w-full bg-zinc-100 text-zinc-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
                Log out
              </button>
            </form>
            <Link href="/" className="block text-center text-sm text-amber-600 hover:underline">
              ← Back to recipes
            </Link>
          </div>
        ) : (
          <form action={adminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                autoFocus
                className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
            <button type="submit" className="w-full bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
              Log in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
