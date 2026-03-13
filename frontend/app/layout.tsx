import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "農地分析システム",
  description: "写真から農地情報を自動抽出・データベース化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
