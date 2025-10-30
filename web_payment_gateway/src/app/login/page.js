"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = email/password, 2 = OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (step === 1) {
        // Step 1: Login dengan email + password
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          if (data.requiresMfa) {
            setSuccess("OTP telah dikirim ke nomor Anda.");
            setStep(2);
          } else {
            // Langsung redirect jika tidak butuh MFA
            router.push("/select-item");
          }
        } else {
          setError(data.message || "Login gagal.");
        }
      } else {
        // Step 2: Verifikasi OTP → kirim ke endpoint terpisah
        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess("Verifikasi berhasil! Mengalihkan...");
          setTimeout(() => router.push("/select-item"), 1000);
        } else {
          setError(data.message || "OTP salah atau kadaluarsa.");
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {step === 1 ? "Login" : "Verifikasi OTP"}
        </h1>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-75"
              >
                {loading ? "Memproses..." : "Login"}
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-700 text-sm">
                Kami telah mengirim kode OTP ke nomor Anda. Masukkan kode 6
                digit di bawah:
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode OTP *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-75"
              >
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setSuccess("");
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Kembali ke login
              </button>
            </>
          )}
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Belum punya akun?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-blue-600 hover:underline font-medium"
          >
            Daftar di sini
          </button>
        </p>
      </div>
    </div>
  );
}
