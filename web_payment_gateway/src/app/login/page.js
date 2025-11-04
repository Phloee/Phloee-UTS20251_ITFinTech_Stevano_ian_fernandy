"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userPhone, setUserPhone] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (step === 1) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Email atau password salah");
          return;
        }

        if (result?.ok) {
          const userRes = await fetch("/api/auth/session");
          const session = await userRes.json();

          if (session?.user?.mfaEnabled) {
            const otpRes = await fetch("/api/request-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nomor: session.user.whatsapp }),
            });

            const otpData = await otpRes.json();

            if (otpRes.ok) {
              setUserPhone(session.user.whatsapp);
              setSuccess("OTP telah dikirim ke WhatsApp Anda!");
              setStep(2);
            } else {
              setError(otpData.message || "Gagal mengirim OTP");
            }
          } else {
            handleRedirectAfterLogin(session);
          }
        }
      } else {
        const verifyRes = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const verifyData = await verifyRes.json();

        if (verifyRes.ok && verifyData.success) {
          setSuccess("Verifikasi berhasil!");
          const sessionRes = await fetch("/api/auth/session");
          const session = await sessionRes.json();
          setTimeout(() => handleRedirectAfterLogin(session), 1000);
        } else {
          setError(verifyData.message || "OTP salah atau expired");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectAfterLogin = (session) => {
    const redirectPath = localStorage.getItem("redirect_after_login");
    if (redirectPath) {
      localStorage.removeItem("redirect_after_login");
      router.push(redirectPath);
    } else {
      router.push(
        session?.user?.role === "admin" ? "/admin/dashboard" : "/select-items"
      );
    }
    router.refresh();
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
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {loading ? "Memproses..." : "Login"}
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-sm">
                Kode OTP telah dikirim ke {userPhone}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="w-full px-3 py-2 border rounded text-center text-2xl font-mono"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-green-600 text-white rounded"
              >
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-600"
              >
                ← Kembali
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
