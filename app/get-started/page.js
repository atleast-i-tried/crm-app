"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GetStartedPage() {
  const router = useRouter();

  // optional: pre-route to dashboard after successful sign-in
  const handleLogin = async () => {
    // sign in via NextAuth; callbackUrl sends user to /dashboard on success
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-xl border">
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold text-blue-900">XenoCRM</h1>
          <p className="mt-2 text-slate-600">Welcome — finish setup by signing in with Google</p>
        </header>

        <div className="mt-8">
          <Button
            size="lg"
            onClick={handleLogin}
            className="w-full h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogIn className="mr-3 h-5 w-5" />
            Login with Google
          </Button>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          After sign in you'll be redirected to your dashboard.
        </p>
      </div>
    </div>
  );
}
