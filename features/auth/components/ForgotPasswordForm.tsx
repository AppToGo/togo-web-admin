"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/features/auth/hooks/useAuth";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(email, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          ¡Revisa tu correo!
        </h3>
        <p className="text-sm text-slate-500">
          Hemos enviado instrucciones para restablecer tu contraseña a{" "}
          <strong>{email}</strong>
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full mt-4">
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-500">
        Ingresa tu correo electrónico y te enviaremos instrucciones para
        restablecer tu contraseña.
      </p>

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tu@empresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={forgotPassword.isPending}
        disabled={forgotPassword.isPending}
      >
        Enviar instrucciones
      </Button>

      <p className="text-center text-sm text-slate-500">
        ¿Recordaste tu contraseña?{" "}
        <Link
          href="/login"
          className="text-[#6366F1] hover:text-[#5558E0] hover:underline font-medium"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
