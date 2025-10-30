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
        console.log("🔐 Logging in with:", { email });

        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("📥 Login response:", data);

        if (res.ok) {
          if (data.requiresMfa) {
            setSuccess("✅ OTP telah dikirim ke nomor WhatsApp Anda.");
            setStep(2); // Pindah ke step verifikasi OTP
          } else {
            // Langsung redirect jika tidak butuh MFA
            setSuccess("✅ Login berhasil! Mengalihkan...");

            // ✅ Simpan user data ke localStorage
            if (data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
            }

            setTimeout(() => router.push("/select-item"), 1000);
          }
        } else {
          setError(
            data.message || "Login gagal. Periksa email dan password Anda."
          );
        }
      } else {
        // Step 2: Verifikasi OTP
        console.log("🔢 Verifying OTP:", { email, otp });

        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }), // ✅ Kirim email dan OTP
        });

        const data = await res.json();
        console.log("📥 Verify response:", data);

        if (res.ok && data.success) {
          setSuccess("✅ Verifikasi berhasil! Mengalihkan...");

          // ✅ Simpan user data ke localStorage
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }

          setTimeout(() => router.push("/select-item"), 1000);
        } else {
          setError(
            data.message || "OTP salah atau kadaluarsa. Silakan coba lagi."
          );
        }
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email tidak ditemukan. Silakan login ulang.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Kirim ulang request ke /api/login untuk generate OTP baru
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.requiresMfa) {
        setSuccess("✅ OTP baru telah dikirim ke nomor WhatsApp Anda.");
        setOtp(""); // Clear OTP input
      } else {
        setError("Gagal mengirim OTP baru. Silakan login ulang.");
      }
    } catch (err) {
      setError("Gagal mengirim OTP baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {step === 1 ? "🔐 Login" : "🔢 Verifikasi OTP"}
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            {step === 1
              ? "Masukkan email dan password Anda"
              : "Masukkan kode OTP yang dikirim ke WhatsApp"}
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg mb-4 text-sm flex items-start">
            <span className="mr-2">✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-4 text-sm flex items-start">
            <span className="mr-2">❌</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {step === 1 ? (
            <>
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="nama@example.com"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "⏳ Memproses..." : "Login"}
              </button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kode OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="000000"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Masukkan 6 digit kode yang dikirim ke WhatsApp Anda
                </p>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "⏳ Memverifikasi..." : "Verifikasi OTP"}
              </button>

              {/* Resend OTP */}
              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium transition"
                  disabled={loading}
                >
                  ← Kembali ke login
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-blue-600 hover:text-blue-800 font-medium transition disabled:text-gray-400"
                  disabled={loading}
                >
                  Kirim ulang OTP
                </button>
              </div>
            </>
          )}
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition"
            >
              Daftar di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
