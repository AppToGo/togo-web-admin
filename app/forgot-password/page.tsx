"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] p-4">
      <div className="w-full max-w-md animate-slideIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#6366F1] shadow-lg shadow-[#6366F1]/25 mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="text-slate-500 mt-1">Te ayudaremos a restablecer tu acceso</p>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              No te preocupes, te enviaremos instrucciones para recuperarla
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Recordaste tu contraseña?{" "}
          <Link
            href="/login"
            className="text-[#6366F1] hover:text-[#5558E0] hover:underline font-medium"
          >
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
