import { cookies } from "next/headers";
import AdminLogin from "@/components/admin/AdminLogin";
import SuperAdminDashboard from "@/components/admin/SuperAdminDashboard";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) return <AdminLogin />;
  return <SuperAdminDashboard adminEmail={session.email} />;
}
