import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PriorityBolt } from "./PriorityBolt";

const meta = {
  title: "Tickets/PriorityBolt",
  component: PriorityBolt,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { priority: "urgent", showLabel: false, size: 16 },
  argTypes: {
    priority: { control: "inline-radio", options: ["normal", "urgent", "severe"] },
    size: { control: { type: "range", min: 10, max: 48, step: 2 } },
  },
} satisfies Meta<typeof PriorityBolt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { priority: "normal" } };
export const Urgent: Story = { args: { priority: "urgent" } };
export const Severe: Story = { args: { priority: "severe" } };
export const WithLabel: Story = { args: { priority: "severe", showLabel: true } };

export const AllPriorities: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <PriorityBolt priority="normal" showLabel />
      <PriorityBolt priority="urgent" showLabel />
      <PriorityBolt priority="severe" showLabel />
    </div>
  ),
};
