import "./globals.css";
import ClientLayout from "./ClientLayout";
import Providers from "./Providers"; // <-- LANGKAH 1: Import komponen Providers

export const metadata = {
  title: "Payment Gateway Store - UTS IT Financial Services",
  description:
    "E-commerce with payment gateway integration using Next.js, MongoDB, and Xendit",
  keywords: "payment gateway, e-commerce, next.js, mongodb, xendit",
  authors: [{ name: "UTS IT Financial Services" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        suppressHydrationWarning={true}
        className="text-gray-800 antialiased font-sans min-h-screen bg-snow-bg"
      >
        {/* LANGKAH 2: Bungkus ClientLayout dengan komponen Providers */}
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
