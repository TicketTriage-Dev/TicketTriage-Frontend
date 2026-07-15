"use client";

// Button — thin wrapper over react-bootstrap Button. Adds a `loading` state
// (spinner + auto-disable) used across the app's forms (login, create ticket,
// status changes). Variants are themed in styles/theme.scss (primary=navy,
// secondary=gold). Import this instead of react-bootstrap's Button directly.
import { Button as RBButton, Spinner } from "react-bootstrap";
import type { ButtonProps as RBButtonProps } from "react-bootstrap";

export interface ButtonProps extends RBButtonProps {
  /** Show a spinner and disable the button while an action is in flight. */
  loading?: boolean;
}

export function Button({ loading = false, disabled, children, ...rest }: ButtonProps) {
  return (
    <RBButton disabled={disabled || loading} {...rest}>
      {loading && (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
      )}
      {children}
    </RBButton>
  );
}
