import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppShell } from "./AppShell";

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/board" } },
  },
  args: { userName: "Parinita Dutta" },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h1 style={{ color: "var(--navy)" }}>Board</h1>
        <p className="text-muted">Page content renders here, inside the shell.</p>
      </div>
    ),
  },
};