import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { fn } from "storybook/test";

import type { TicketStatus } from "@/types";
import { StatusControl } from "./StatusControl";

const meta = {
  title: "Tickets/StatusControl",
  component: StatusControl,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { status: "Assigned", onChange: fn(), disabled: false, size: "sm" },
} satisfies Meta<typeof StatusControl>;

export default meta;
type Story = StoryObj<typeof meta>;

// Controlled component — the demo owns the state so the dropdown is interactive.
function Demo(args: ComponentProps<typeof StatusControl>) {
  const [status, setStatus] = useState<TicketStatus>(args.status);
  return <StatusControl {...args} status={status} onChange={setStatus} />;
}

export const Interactive: Story = { render: (args) => <Demo {...args} /> };
export const InProgress: Story = { args: { status: "In Progress" }, render: (args) => <Demo {...args} /> };
export const Disabled: Story = { args: { disabled: true }, render: (args) => <Demo {...args} /> };
