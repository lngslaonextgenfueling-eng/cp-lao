"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleBtn = useRef<HTMLDivElement>(null);

  const goNext = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    // only allow same-site relative paths
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          try {
            await loginWithGoogle(resp.credential);
            goNext();
          } catch (e: any) {
            setError(e.message);
          }
        },
      });
      if (googleBtn.current) {
        window.google?.accounts.id.renderButton(googleBtn.current, { theme: "outline", size: "large", width: 320 });
      }
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password, phone || undefined);
      goNext();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">{mode === "login" ? "ເຂົ້າສູ່ລະບົບ" : "ສະໝັກສະມາຊິກ"}</h1>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        {mode === "register" && (
          <>
            <input className="input" placeholder="ຊື່-ນາມສະກຸນ" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="input" placeholder="ເບີໂທ (ບໍ່ບັງຄັບ)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}
        <input className="input" type="email" placeholder="ອີເມວ" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="ລະຫັດຜ່ານ (ຢ່າງໜ້ອຍ 6 ຕົວ)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "ກະລຸນາລໍຖ້າ…" : mode === "login" ? "ເຂົ້າສູ່ລະບົບ" : "ສະໝັກສະມາຊິກ"}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" /> ຫຼື <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div ref={googleBtn} className="flex justify-center" />
        </>
      )}

      <button
        className="mt-4 w-full text-center text-sm text-brand-600 hover:underline"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
      >
        {mode === "login" ? "ຍັງບໍ່ມີບັນຊີ? ສະໝັກສະມາຊິກ" : "ມີບັນຊີແລ້ວ? ເຂົ້າສູ່ລະບົບ"}
      </button>
    </div>
  );
}
