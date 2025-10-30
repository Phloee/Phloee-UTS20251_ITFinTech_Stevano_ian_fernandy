import "./globals.css";
import ClientLayout from "./ClientLayout";

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
