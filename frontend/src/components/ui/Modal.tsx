"use client";

// Modal — wrapper over react-bootstrap Modal that standardizes the header/body/
// footer structure and on-brand title styling. Consumers (e.g. Soham's
// CreateTicketPanel, confirm dialogs) pass `title`, body via children, and an
// optional `footer`. Pass `footer={null}` to omit the footer entirely; omit it
// to get a default Close button.
import type { ReactNode } from "react";
import { Modal as RBModal } from "react-bootstrap";
import { Button } from "./Button";

export interface ModalProps {
  /** Whether the modal is visible. */
  show: boolean;
  /** Called when the modal requests to close (backdrop, Esc, close button). */
  onHide: () => void;
  /** Header title. Omit for a header-less modal. */
  title?: ReactNode;
  /** Body content. */
  children?: ReactNode;
  /** Footer content. Omit for a default Close button; pass null to hide the footer. */
  footer?: ReactNode;
  size?: "sm" | "lg" | "xl";
  /** Vertically center the dialog (default true). */
  centered?: boolean;
}

export function Modal({
  show,
  onHide,
  title,
  children,
  footer,
  size,
  centered = true,
}: ModalProps) {
  return (
    <RBModal show={show} onHide={onHide} size={size} centered={centered}>
      {title && (
        <RBModal.Header closeButton>
          <RBModal.Title
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: "var(--navy)",
              fontSize: "1.1rem",
            }}
          >
            {title}
          </RBModal.Title>
        </RBModal.Header>
      )}

      <RBModal.Body>{children}</RBModal.Body>

      {footer !== null && (
        <RBModal.Footer>
          {footer ?? (
            <Button variant="secondary" onClick={onHide}>
              Close
            </Button>
          )}
        </RBModal.Footer>
      )}
    </RBModal>
  );
}
