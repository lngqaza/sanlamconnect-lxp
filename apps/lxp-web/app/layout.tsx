import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sanlam LXP — Skills Dashboard",
  description: "Sanlam intermediary skills learning experience platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
