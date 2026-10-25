import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "../context/AppContext";

export const viewport: Viewport = {
  themeColor: "#9F1D22",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Tel-UTask | Sistem Manajemen Tugas Akademik Universitas Telkom",
  description:
    "Aplikasi pendamping pengelolaan tugas perkuliahan, praktikum, dan tugas besar mahasiswa Universitas Telkom.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-[100dvh] antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
