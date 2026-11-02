import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { PersonalizationSetup } from "./PersonalizationSetup";
vi.mock("@/components/astra/WallpaperCatalog", () => ({ WallpaperCatalog: () => null }));
vi.mock("@/components/astra/AppearancePreview", () => ({ AppearancePreview: () => null }));
it("keeps new-account clock choices in a draft until confirmation", () => {
  const confirm = vi.fn();
  render(<PersonalizationSetup busy={false} onBack={() => {}} onConfirm={confirm}/>);
  fireEvent.click(screen.getByRole("switch", { name: "Show clock", exact: true }));
  expect(confirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm my look" }));
  expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ showClock: false }));
});