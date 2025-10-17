export const BRAND = {
  name: "Домик",
  latin: "Domik",
  tagline: "Ночлег по-соседски",
  colors: { primary: "#0F766E", accent: "#E7E0D1" }
} as const;

export type Brand = typeof BRAND;
