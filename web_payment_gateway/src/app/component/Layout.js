"use client";
import Head from "next/head";

export default function Layout({ children, title = "Payment Gateway Store" }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="E-commerce store with payment gateway integration"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">{children}</div>
    </>
  );
}
