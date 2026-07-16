import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your team's triage board"
      footer={
        <span className="text-muted">
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--navy)", fontWeight: 600 }}>
            Sign in
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
