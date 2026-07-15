// Badge — thin wrapper over react-bootstrap Badge with a navy default so labels
// read on-brand out of the box. Forwards all react-bootstrap Badge props.
import { Badge as RBBadge } from "react-bootstrap";
import type { BadgeProps as RBBadgeProps } from "react-bootstrap";

export type BadgeProps = RBBadgeProps;

export function Badge({ bg = "primary", ...rest }: BadgeProps) {
  return <RBBadge bg={bg} {...rest} />;
}
