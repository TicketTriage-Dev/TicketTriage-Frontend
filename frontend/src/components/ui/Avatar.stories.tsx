import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "./Avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { name: "Parinita Dutta", size: 36 },
  argTypes: {
    size: { control: { type: "range", min: 20, max: 96, step: 4 } },
    background: { control: "color" },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleName: Story = { args: { name: "Soham" } };
export const Large: Story = { args: { size: 64 } };
export const Gold: Story = { args: { background: "var(--gold)" } };

export const Team: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Avatar name="Soham" />
      <Avatar name="Parinita Dutta" />
      <Avatar name="Aditya" />
      <Avatar name="Meera" />
    </div>
  ),
};
