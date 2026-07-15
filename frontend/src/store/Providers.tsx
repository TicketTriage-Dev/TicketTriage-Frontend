"use client";

import { Provider } from "react-redux";
import { store } from "./index";

/** Wraps the app in the Redux store. Used once, in the root layout. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
