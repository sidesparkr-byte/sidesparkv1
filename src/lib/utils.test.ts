import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD values to $X.XX", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(7.5)).toBe("$7.50");
    expect(formatCurrency(1234.567)).toBe("$1,234.57");
  });
});
