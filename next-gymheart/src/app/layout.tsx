import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getSession } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymHeart Fitness",
  description: "Đăng ký khóa học, theo dõi lịch tập và quản lý hồ sơ tại GymHeart Fitness.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <Header session={session} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
