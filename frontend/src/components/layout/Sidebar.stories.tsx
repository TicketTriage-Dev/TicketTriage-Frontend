import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Sidebar } from "./Sidebar";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/board" } },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BoardActive: Story = {};

export const QueueActive: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/queue" } } },
};