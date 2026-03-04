"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/hooks/useAuth";

export function RegisterForm() {
  const register = useRegister();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    register.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre completo"
        placeholder="Juan Pérez"
        value={formData.name}
        onChange={(e) =>
          setFormData({ ...formData, name: e.target.value })
        }
        required
      />

      <Input
        label="Nombre del negocio"
        placeholder="Mi Restaurante"
        value={formData.businessName}
        onChange={(e) =>
          setFormData({ ...formData, businessName: e.target.value })
        }
        required
      />

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tu@empresa.com"
        value={formData.email}
        onChange={(e) =>
          setFormData({ ...formData, email: e.target.value })
        }
        required
      />

      <Input
        label="Teléfono"
        type="tel"
        placeholder="+573001234567"
        value={formData.phoneNumber}
        onChange={(e) =>
          setFormData({ ...formData, phoneNumber: e.target.value })
        }
        required
        helperText="Formato internacional: +57XXXXXXXXXX"
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={(e) =>
          setFormData({ ...formData, password: e.target.value })
        }
        required
        helperText="Mínimo 8 caracteres"
      />

      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={(e) =>
          setFormData({ ...formData, confirmPassword: e.target.value })
        }
        required
        error={
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword
            ? "Las contraseñas no coinciden"
            : undefined
        }
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={register.isPending}
        disabled={register.isPending}
      >
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes una cuenta?{" "}
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
