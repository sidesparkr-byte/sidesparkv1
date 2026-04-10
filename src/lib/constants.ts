export const STRIPE_RATE = 0.029 as const;
export const STRIPE_FIXED = 0.3 as const;

export type FeeListingType = "item" | "service";

export type FeeConfig = {
  sellerRate: number;
  buyerRate: number;
  buyerMin: number;
};

export const FEE_CONFIG: Record<FeeListingType, FeeConfig> = {
  item: {
    sellerRate: 0.06,
    buyerRate: 0.02,
    buyerMin: 0.5
  },
  service: {
    sellerRate: 0.08,
    buyerRate: 0.03,
    buyerMin: 0.75
  }
} as const;

export const MIN_CURRENCY_AMOUNT = 0.01 as const;
