export const RWA_CATEGORY_LABELS = [
  "沉香",
  "彩色钻石",
  "古玉",
  "翡翠",
  "字画",
  "瓷器",
  "田黄",
  "宝石",
  "木器",
] as const;

export const RWA_SELLER_CATEGORY_LABELS = ["平台", "会员", "认证商家"] as const;

const CATEGORY_KEYWORDS: Array<{
  label: (typeof RWA_CATEGORY_LABELS)[number];
  keywords: string[];
}> = [
  { label: "沉香", keywords: ["沉香", "agarwood", "沉香木"] },
  {
    label: "彩色钻石",
    keywords: [
      "彩钻",
      "彩色钻石",
      "fancy colored diamond",
      "fancy color diamond",
    ],
  },
  { label: "古玉", keywords: ["古玉", "和田玉", "玉器", "old jade"] },
  { label: "翡翠", keywords: ["翡翠", "jadeite"] },
  {
    label: "字画",
    keywords: ["字画", "书法", "国画", "书画", "calligraphy", "painting"],
  },
  { label: "瓷器", keywords: ["瓷器", "青花", "瓷", "porcelain"] },
  { label: "田黄", keywords: ["田黄", "田黄石", "shoushan"] },
  {
    label: "宝石",
    keywords: [
      "宝石",
      "蓝宝石",
      "红宝石",
      "祖母绿",
      "sapphire",
      "ruby",
      "emerald",
      "diamond",
      "gem",
    ],
  },
  { label: "木器", keywords: ["木器", "木雕", "木艺", "wood"] },
];

export function formatRwaPrice(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: num >= 1000 ? 0 : 2,
  }).format(num);
}

export function formatRwaPriceWithCurrency(value: string) {
  return `￥ ${formatRwaPrice(value)} 元`;
}

export function getRwaSellerCategoryClassName(label: string) {
  switch (label) {
    case "平台":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "会员":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "认证商家":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-sky-100 bg-white text-sky-900/60";
  }
}

export function resolveRwaCategoryLabel(name: string, tokenId: bigint) {
  const normalizedName = name.toLowerCase();
  const matched = CATEGORY_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword.toLowerCase())),
  );

  if (matched) return matched.label;

  const fallbackIndex = Number(
    (tokenId > 0n ? tokenId - 1n : 0n) % BigInt(RWA_CATEGORY_LABELS.length),
  );
  return RWA_CATEGORY_LABELS[fallbackIndex];
}

export function resolveRwaSellerCategoryLabel(tokenId: bigint) {
  const fallbackIndex = Number(
    (tokenId > 0n ? tokenId - 1n : 0n) %
      BigInt(RWA_SELLER_CATEGORY_LABELS.length),
  );
  return RWA_SELLER_CATEGORY_LABELS[fallbackIndex];
}
