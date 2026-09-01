"use client";

import dynamic from "next/dynamic";
import type {ComponentProps} from "react";

import {AuthFormSkeleton} from "@/components/ui/loading-skeletons";

const LoginForm = dynamic(
  () => import("@/features/auth/login-form").then((module) => module.LoginForm),
  {loading: () => <AuthFormSkeleton variant="login" />},
);
const RegisterForm = dynamic(
  () => import("@/features/auth/register-form").then((module) => module.RegisterForm),
  {loading: () => <AuthFormSkeleton variant="register" />},
);
const PasswordRecoveryForm = dynamic(
  () => import("@/features/auth/password-recovery-form").then((module) => module.PasswordRecoveryForm),
  {loading: () => <AuthFormSkeleton variant="recovery" />},
);

export function LoginFormClient(props: ComponentProps<typeof LoginForm>) {
  return <LoginForm {...props} />;
}

export function RegisterFormClient() {
  return <RegisterForm />;
}

export function PasswordRecoveryFormClient() {
  return <PasswordRecoveryForm />;
}
