import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "react-bootstrap";
import { mockCategories, mockEmployees, mockTickets } from "@/lib/mockData";
import { TicketCard } from "./TicketCard";

const categoryName = (id: number) =>
  mockCategories.find((c) => c.category_id === id)?.name;
const assigneeName = (id: number | null) =>
  id == null ? null : (mockEmployees.find((e) => e.id === id)?.name ?? null);

const base = mockTickets[0];

const meta = {
  title: "Tickets/TicketCard",
  component: TicketCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  // The card lives in a ~320px board column — constrain it so stories read true.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    ticket: base,
    categoryName: categoryName(base.category_id),
    assigneeName: assigneeName(base.assigned_to),
  },
} satisfies Meta<typeof TicketCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Severe: Story = {
  args: (() => {
    const t = mockTickets.find((t) => t.priority === "severe")!;
    return { ticket: t, categoryName: categoryName(t.category_id), assigneeName: assigneeName(t.assigned_to) };
  })(),
};

export const Unassigned: Story = {
  args: {
    ticket: { ...base, assigned_to: null },
    assigneeName: null,
  },
};

export const Clickable: Story = {
  args: { onClick: () => {} },
};

export const WithActions: Story = {
  args: {
    actions: (
      <Button size="sm" variant="secondary">
        Move
      </Button>
    ),
  },
};

export const Column: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {mockTickets.slice(0, 4).map((t) => (
        <TicketCard
          key={t.ticket_id}
          ticket={t}
          categoryName={categoryName(t.category_id)}
          assigneeName={assigneeName(t.assigned_to)}
        />
      ))}
    </>
  ),
};
