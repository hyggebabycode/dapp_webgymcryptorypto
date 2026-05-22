import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CheckInRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const tokenQuery = params.token ? `?token=${encodeURIComponent(params.token)}` : "";

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/check-in${tokenQuery}`)}`);
  }

  if (session.role === "admin" || session.role === "coach") {
    redirect(`/dashboard/${session.role}/check-in${tokenQuery}`);
  }

  redirect("/dashboard/user");
}
