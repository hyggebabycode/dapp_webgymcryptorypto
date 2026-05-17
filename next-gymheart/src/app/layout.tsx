import type { Metadata } from "next";
import Script from "next/script";
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
        <Script id="clean-extension-attrs" strategy="beforeInteractive">
          {`
            (function () {
              function clean(node) {
                if (!node || node.nodeType !== 1) return;
                var attrs = Array.prototype.slice.call(node.attributes || []);
                attrs.forEach(function (attr) {
                  if (
                    attr.name === "bis_skin_checked" ||
                    attr.name === "bis_register" ||
                    attr.name.indexOf("__processed_") === 0
                  ) {
                    node.removeAttribute(attr.name);
                  }
                });
              }

              function cleanTree(root) {
                clean(root);
                if (!root || !root.querySelectorAll) return;
                root.querySelectorAll("*").forEach(clean);
              }

              cleanTree(document.documentElement);

              new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                  clean(mutation.target);
                  mutation.addedNodes.forEach(cleanTree);
                });
              }).observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true
              });
            })();
          `}
        </Script>
        <Header session={session} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
