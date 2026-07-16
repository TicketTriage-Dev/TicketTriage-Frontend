import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={
        <span className="text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--navy)", fontWeight: 600 }}>
            Create one
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
