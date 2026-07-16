"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Form } from "react-bootstrap";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/authSlice";
import { HOME_BY_ROLE } from "@/constants";

/** Email + password form. On success, redirects the user to their role's home. */
export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submitting = status === "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      router.replace(HOME_BY_ROLE[result.payload.role]);
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert variant="danger" className="py-2">
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId="login-email">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          disabled={submitting}
        />
      </Form.Group>

      <Form.Group className="mb-4" controlId="login-password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={submitting}
        />
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100"
        loading={submitting}
        disabled={!email || !password}
      >
        Sign in
      </Button>
    </Form>
  );
}
