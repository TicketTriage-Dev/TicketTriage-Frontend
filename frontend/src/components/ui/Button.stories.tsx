import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Button", variant: "primary", loading: false },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "light", "outline-primary", "link"],
    },
    loading: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const OutlinePrimary: Story = { args: { variant: "outline-primary" } };
export const Loading: Story = { args: { loading: true, children: "Saving" } };
