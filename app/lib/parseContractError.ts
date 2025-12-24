import { ERROR_MAP } from "./errorMap";

export function parseContractError(err: any): string {
  const raw =
    err?.shortMessage ||
    err?.cause?.shortMessage ||
    err?.message ||
    "";

  for (const key in ERROR_MAP) {
    if (raw.includes(key)) return ERROR_MAP[key];
  }

  return "Transaction failed";
}
