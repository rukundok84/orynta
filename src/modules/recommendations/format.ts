/**
 * Pure formatting helpers shared by server and client code.
 *
 * IMPORTANT: this module must never import database or Node-only code —
 * client components import from here, and bundlers will fail on Node
 * built-ins (fs, net, dns) in the browser bundle.
 */

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString("en-US")} RWF`;
}

export function labelProvince(
  province:
    | "KIGALI_CITY"
    | "SOUTHERN"
    | "NORTHERN"
    | "EASTERN"
    | "WESTERN",
): string {
  return province === "KIGALI_CITY"
    ? "Kigali City"
    : `${province.charAt(0)}${province.slice(1).toLowerCase()} Province`;
}
