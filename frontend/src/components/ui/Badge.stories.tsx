import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Badge", bg: "primary" },
  argTypes: {
    bg: {
      control: "select",
      options: ["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"],
    },
    pill: { control: "boolean" },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Navy: Story = {};
export const Gold: Story = { args: { bg: "secondary" } };
export const Pill: Story = { args: { pill: true, children: "3" } };
