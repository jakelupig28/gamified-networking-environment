import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetMaster",
  description: "Gamified Networking Learning Environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem("sidebar-collapsed") === "true") {
                  document.documentElement.classList.add("sidebar-collapsed");
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col preload">{children}</body>
    </html>
  );
}