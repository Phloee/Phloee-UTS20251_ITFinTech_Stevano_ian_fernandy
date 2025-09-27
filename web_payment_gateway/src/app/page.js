// src/app/page.js
import Link from "next/link";


const ButtonWithHover = ({ href, children }) => (
  <Link
    href={href}
    className="
            px-12 py-4 text-xl font-extrabold rounded-full transition-all duration-300 transform 
            bg-lavender text-white shadow-lg 
            hover:bg-lavender/80 hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-lavender focus:ring-opacity-50 
            flex items-center justify-center tracking-widest uppercase
        "
  >
    {children}
  </Link>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-gray-800">
      <main className="text-center fade-in max-w-lg">
        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter text-lavender drop-shadow-lg">
          IkanLele Shop
        </h1>

        <div className="mt-8">
          <ButtonWithHover href="/select-items">
            🐟 Ayo Belanja Le! 💸
          </ButtonWithHover>
        </div>

        <footer className="mt-16 text-sm text-gray-500">
          <p>UTS IT Financial Services Project | 2025</p>
        </footer>
      </main>
    </div>
  );
}
