import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";
import { EmptyState, ErrorState, LoadingState } from "./States";

const meta = {
  title: "UI/States",
  component: EmptyState,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  render: () => <LoadingState label="Loading your queue…" />,
};

export const Empty: Story = {
  render: () => (
    <EmptyState
      title="No tickets assigned"
      message="Tickets your team assigns to you will show up here."
    />
  ),
};

export const EmptyWithAction: Story = {
  render: () => (
    <EmptyState
      title="You're all caught up"
      message="Nothing left in your queue."
      action={
        <Button variant="secondary" size="sm">
          Refresh
        </Button>
      }
    />
  ),
};

export const Error: Story = {
  render: () => <ErrorState message="We couldn't load your tickets." onRetry={() => {}} />,
};
