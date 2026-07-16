"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Form } from "react-bootstrap";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { register } from "@/store/authSlice";
import { DESIGNATIONS, HOME_BY_ROLE } from "@/constants";

/** Registration form. On success the user is auto-logged-in and sent to their dashboard. */
export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState<string>(DESIGNATIONS[0]);
  const submitting = status === "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(register({ name, email, password, designation }));
    if (register.fulfilled.match(result)) {
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

      <Form.Group className="mb-3" controlId="register-name">
        <Form.Label>Full name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
          required
          disabled={submitting}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="register-email">
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

      <Form.Group className="mb-3" controlId="register-password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={submitting}
        />
      </Form.Group>

      <Form.Group className="mb-4" controlId="register-designation">
        <Form.Label>Designation</Form.Label>
        <Form.Select
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          disabled={submitting}
        >
          {DESIGNATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100"
        loading={submitting}
        disabled={!name || !email || !password}
      >
        Create account
      </Button>
    </Form>
  );
}
