"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] p-4">
      <div className="w-full max-w-md animate-slideIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#6366F1] shadow-lg shadow-[#6366F1]/25 mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido a Togo</h1>
          <p className="text-slate-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="text-[#6366F1] hover:text-[#5558E0] hover:underline font-medium"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
