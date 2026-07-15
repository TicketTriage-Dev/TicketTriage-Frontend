import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { useState } from "react";

import { Button } from "./Button";
import { Modal } from "./Modal";

const meta = {
  title: "UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  args: {
    show: false,
    onHide: () => {},
    title: "Create ticket",
    children: "Modal body content goes here.",
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Modals are driven by open/close state — this demo owns that state so the
// story is interactive (click to open, backdrop/Esc/Close to dismiss).
function Demo(args: ComponentProps<typeof Modal>) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Button onClick={() => setShow(true)}>Open modal</Button>
      <Modal {...args} show={show} onHide={() => setShow(false)} />
    </>
  );
}

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};

export const WithCustomFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="light">Cancel</Button>
        <Button variant="primary">Save</Button>
      </>
    ),
  },
  render: (args) => <Demo {...args} />,
};

export const NoFooter: Story = {
  args: { footer: null, title: "Heads up" },
  render: (args) => <Demo {...args} />,
};
