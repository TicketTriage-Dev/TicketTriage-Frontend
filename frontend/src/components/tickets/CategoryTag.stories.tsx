import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DEFAULT_CATEGORIES } from "@/constants";
import { CategoryTag } from "./CategoryTag";

const meta = {
  title: "Tickets/CategoryTag",
  component: CategoryTag,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { name: "Frontend" },
  argTypes: { color: { control: "color" } },
} satisfies Meta<typeof CategoryTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Backend: Story = { args: { name: "Backend" } };

export const AllCategories: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {DEFAULT_CATEGORIES.map((c) => (
        <CategoryTag key={c} name={c} />
      ))}
    </div>
  ),
};
