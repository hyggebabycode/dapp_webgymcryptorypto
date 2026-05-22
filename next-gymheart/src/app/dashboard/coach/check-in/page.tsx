import { CheckInDashboard } from "@/components/attendance/check-in-dashboard";

export const dynamic = "force-dynamic";

export default async function CoachCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <CheckInDashboard
      error={params.error}
      token={params.token}
      updated={params.updated}
    />
  );
}
