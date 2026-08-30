import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/services/weatherApi", () => ({
  searchCity: vi.fn(),
}));

import { searchCity } from "@/services/weatherApi";
import SearchBar from "@/components/SearchBar";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchBar", () => {
  it("renders a properly labeled search input", () => {
    render(<SearchBar onSelectCity={vi.fn()} />);
    expect(screen.getByLabelText(/search for a city/i)).toBeInTheDocument();
  });

  it("does not call the search service for an empty query", () => {
    render(<SearchBar onSelectCity={vi.fn()} />);
    expect(searchCity).not.toHaveBeenCalled();
  });

  it("searches (debounced) and lists matching cities", async () => {
    searchCity.mockResolvedValue([
      { id: 1, name: "Lahore", admin1: "Punjab", country: "Pakistan" },
    ]);
    const user = userEvent.setup();
    render(<SearchBar onSelectCity={vi.fn()} />);

    await user.type(screen.getByLabelText(/search for a city/i), "Lah");

    await waitFor(() => expect(searchCity).toHaveBeenCalledWith("Lah"), {
      timeout: 1000,
    });

    expect(
      await screen.findByRole("option", { name: /lahore/i })
    ).toBeInTheDocument();
  });

  it('shows "No cities found" when the search returns nothing', async () => {
    searchCity.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<SearchBar onSelectCity={vi.fn()} />);

    await user.type(screen.getByLabelText(/search for a city/i), "Zzzzz");

    expect(await screen.findByText(/no cities found/i)).toBeInTheDocument();
  });

  it("calls onSelectCity and fills the input when a result is chosen", async () => {
    const onSelectCity = vi.fn();
    searchCity.mockResolvedValue([
      { id: 1, name: "Lahore", admin1: "Punjab", country: "Pakistan" },
    ]);
    const user = userEvent.setup();
    render(<SearchBar onSelectCity={onSelectCity} />);

    await user.type(screen.getByLabelText(/search for a city/i), "Lah");
    const option = await screen.findByRole("option", { name: /lahore/i });
    await user.click(option);

    expect(onSelectCity).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Lahore" })
    );
    expect(screen.getByLabelText(/search for a city/i)).toHaveValue(
      "Lahore, Punjab, Pakistan"
    );
  });

  it("closes the dropdown after a selection is made", async () => {
    searchCity.mockResolvedValue([
      { id: 1, name: "Lahore", admin1: "Punjab", country: "Pakistan" },
    ]);
    const user = userEvent.setup();
    render(<SearchBar onSelectCity={vi.fn()} />);

    await user.type(screen.getByLabelText(/search for a city/i), "Lah");
    const option = await screen.findByRole("option", { name: /lahore/i });
    await user.click(option);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
