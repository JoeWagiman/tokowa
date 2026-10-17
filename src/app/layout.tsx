import type { Metadata } from "next";
import { Jakarta } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tokowa",
    template: "%s | Tokowa",
  },
  description:
    "Belanja dari warung sekitar, cukup lewat WhatsApp. Dipandang agent, dikirim dari tetangga sendiri.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={Jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
