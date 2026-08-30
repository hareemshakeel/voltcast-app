import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// framer-motion's requestAnimationFrame-driven animations are irrelevant to
// what we're testing and can make jsdom flaky, so render plain elements.
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => children,
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...rest }) => <div {...rest}>{children}</div>,
    }
  ),
}));

import ForecastToolCard from "@/components/ForecastToolCard";

describe("ForecastToolCard", () => {
  it("shows a reading state while the tool input is streaming in", () => {
    render(
      <ForecastToolCard
        part={{ state: "input-streaming", input: { location: "Lahore" } }}
      />
    );
    expect(screen.getByText(/reading the request/i)).toBeInTheDocument();
    expect(screen.getByText(/"Lahore"/)).toBeInTheDocument();
  });

  it("shows a fetching state once the input is available", () => {
    render(
      <ForecastToolCard
        part={{ state: "input-available", input: { location: "Karachi" } }}
      />
    );
    expect(screen.getByText(/fetching forecast for/i)).toBeInTheDocument();
    expect(screen.getByText("Karachi")).toBeInTheDocument();
  });

  it("renders the full forecast when output is available", () => {
    render(
      <ForecastToolCard
        part={{
          state: "output-available",
          output: {
            location: { name: "Lahore", country: "Pakistan" },
            current: {
              tempMax: 37,
              feelsLike: 39,
              humidity: 20,
              windSpeed: 10,
              uvIndex: 8,
            },
            days: [
              {
                date: "2026-08-31",
                label: "Mon",
                tempMax: 38,
                tempMin: 27,
                precipitation: 5,
              },
            ],
            alternates: [{ name: "Lahore Cantt", country: "Pakistan" }],
          },
        }}
      />
    );
    expect(screen.getByText("Lahore, Pakistan")).toBeInTheDocument();
    expect(screen.getByText("37")).toBeInTheDocument();
    expect(screen.getByText(/feels like 39/i)).toBeInTheDocument();
    expect(screen.getByText(/also matched/i)).toBeInTheDocument();
  });

  it("shows an error message when the tool call fails", () => {
    render(
      <ForecastToolCard
        part={{ state: "output-error", errorText: "City not found" }}
      />
    );
    expect(
      screen.getByText(/couldn't get that forecast/i)
    ).toBeInTheDocument();
    expect(screen.getByText("City not found")).toBeInTheDocument();
  });
});
