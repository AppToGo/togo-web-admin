"use client";

import * as React from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 mb-5">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Bienvenido a Togo
          </h1>
          <p className="text-slate-500">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Iniciar sesión
            </h2>
            <p className="text-slate-500 text-sm">
              Ingresa tus credenciales para acceder al dashboard
            </p>
          </div>
          
          <LoginForm />
        </div>

        {/* Register link */}
        <p className="text-center text-slate-500 text-sm mt-8">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="text-indigo-500 hover:text-indigo-600 font-medium hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
