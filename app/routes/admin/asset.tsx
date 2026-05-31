import { useEffect, useMemo, useState } from "react";
import { Link, type LoaderFunctionArgs } from "react-router";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Ellipsis,
  ExternalLink,
  FileCheck2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatProductAssetPrice,
  getProductAssetDisplayName,
  mergeProductAssetsWithAdminMetadata,
  type ProductAsset,
} from "@/data/product-assets";
import {
  refreshRwaAdminMetadataMap,
  useRwaAdminMetadataMap,
} from "@/lib/rwa-admin-storage";
import { formatRwaPrice } from "@/lib/rwa";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import { cn } from "@/lib/utils";
import { OffchainAssetEditor } from "./asset/offchain-editor";
import { AssetHeader } from "./asset/shared";

const ASSET_PAGE_SIZE = 10;
const RWA_CHAIN_SYNC_ROUTE = "/admin/asset/sync-chain";

type RwaChainSyncResponse = {
  scanned?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  error?: string;
};

function getAssetChainStatusLabel(status?: ProductAsset["chainStatus"]) {
  if (status === "confirmed") return "已上链";
  if (status === "pending") return "上链中";
  if (status === "failed") return "上链失败";
  return "草稿";
}

function getAssetChainStatusClassName(status?: ProductAsset["chainStatus"]) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminPage(context, request);
  return null;
}

export function meta() {
  return [
    { title: "资产列表 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminAssetList() {
  const adminMetadataMap = useRwaAdminMetadataMap();
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingChain, setSyncingChain] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  const productAssets = useMemo(
    () => mergeProductAssetsWithAdminMetadata(adminMetadataMap),
    [adminMetadataMap],
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(productAssets.map((asset) => asset.categoryLabel).filter(Boolean))),
    [productAssets],
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(productAssets.map((asset) => asset.sellerCategoryLabel).filter(Boolean))),
    [productAssets],
  );
  const filteredAssets = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return productAssets.filter((asset) =>
      (!categoryFilter || asset.categoryLabel === categoryFilter) &&
      (!sourceFilter || asset.sellerCategoryLabel === sourceFilter) &&
      (!certificateFilter ||
        (certificateFilter === "with" && asset.certificateURLs.length > 0) ||
        (certificateFilter === "without" && asset.certificateURLs.length === 0)) &&
      (!q ||
        [
          asset.id,
          getProductAssetDisplayName(asset),
          asset.categoryLabel,
          asset.sellerCategoryLabel,
          asset.spec,
          asset.fileHash,
          asset.chainTokenId,
          asset.pricePhenix,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)),
    );
  }, [categoryFilter, certificateFilter, keyword, productAssets, sourceFilter]);

  const certificateCount = useMemo(
    () => productAssets.reduce((count, asset) => count + asset.certificateURLs.length, 0),
    [productAssets],
  );
  const coveredCount = useMemo(
    () =>
      Object.values(adminMetadataMap).filter((metadata) => metadata.assetKind !== "chain")
        .length,
    [adminMetadataMap],
  );
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ASSET_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = filteredAssets.length === 0
    ? 0
    : (currentPage - 1) * ASSET_PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * ASSET_PAGE_SIZE, filteredAssets.length);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * ASSET_PAGE_SIZE;
    return filteredAssets.slice(start, start + ASSET_PAGE_SIZE);
  }, [currentPage, filteredAssets]);
  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, certificateFilter, keyword, sourceFilter]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshRwaAdminMetadataMap();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncChain = async () => {
    try {
      setSyncingChain(true);
      const response = await fetch(RWA_CHAIN_SYNC_ROUTE, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({})) as RwaChainSyncResponse;

      if (!response.ok) {
        throw new Error(result.error || `同步链上资产失败 (${response.status})`);
      }

      await refreshRwaAdminMetadataMap();
      toast.success(
        `链上同步完成：扫描 ${result.scanned ?? 0}，新增 ${result.created ?? 0}，更新 ${
          result.updated ?? 0
        }，跳过 ${result.skipped ?? 0}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "同步链上资产失败");
    } finally {
      setSyncingChain(false);
    }
  };

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  return (
    <div className="admin-asset-theme min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader title="资产列表">
        <Button asChild size="sm">
          <Link to="/admin/asset/new">
            <Plus />
            添加资产
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleSyncChain()}
          disabled={syncingChain}
        >
          <RefreshCw className={syncingChain ? "animate-spin" : ""} />
          同步链上
        </Button>
        <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
          刷新
        </Button>
      </AssetHeader>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={FileCheck2}
            label="产品资产"
            value={productAssets.length}
            description="前台资产库展示条目"
          />
          <SummaryCard
            icon={BadgeCheck}
            label="证书影像"
            value={certificateCount}
            description="已关联证书与确权资料"
          />
          <SummaryCard
            icon={ShieldCheck}
            label="后台覆盖"
            value={coveredCount}
            description="来自后台存储的覆盖资料"
          />
        </section>

        <Card className="admin-asset-panel gap-0 overflow-hidden p-0">
          <CardContent className="px-0">
            <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-0">
                <AssetFilterDropdown
                  label="分类"
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                />
                <AssetFilterDropdown
                  label="来源"
                  value={sourceFilter}
                  options={sourceOptions}
                  onChange={setSourceFilter}
                />
                <CertificateFilterDropdown
                  value={certificateFilter}
                  onChange={setCertificateFilter}
                />
              </div>

              <label className="relative block w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索资产编号、名称、分类或 hash"
                  className="h-8 pl-9"
                />
              </label>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>资产</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>链状态</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>会员价</TableHead>
                  <TableHead>资料</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    onEditOffchain={setEditingAssetId}
                  />
                ))}
              </TableBody>
            </Table>

            {filteredAssets.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                没有匹配的资产。
              </div>
            ) : null}

            {filteredAssets.length > 0 ? (
              <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  显示 {pageStart}-{pageEnd} / {filteredAssets.length} 条
                </div>
                <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        text="上一页"
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : undefined}
                        className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {paginationItems.map((item, index) => (
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            isActive={item === currentPage}
                            aria-label={`第 ${item} 页`}
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(item);
                            }}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        text="下一页"
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : undefined}
                        className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>

      {editingAssetId ? (
        <OffchainAssetEditor
          assetId={editingAssetId}
          mode="modal"
          onClose={() => setEditingAssetId(null)}
          onSaved={() => setEditingAssetId(null)}
        />
      ) : null}
    </div>
  );
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);

  if (currentPage <= 3) {
    pageSet.add(2);
    pageSet.add(3);
    pageSet.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pageSet.add(totalPages - 1);
    pageSet.add(totalPages - 2);
    pageSet.add(totalPages - 3);
  }

  const pages = Array.from(pageSet)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return pages.flatMap<(number | "ellipsis")>((item, index) => {
    const previous = pages[index - 1];

    if (previous && item - previous > 1) {
      return ["ellipsis", item];
    }

    return [item];
  });
}

function AssetFilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="ring-0!">
          <span>{value ? `${label}: ${value}` : label}</span>
          <ChevronDown strokeWidth={1} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          {label}过滤
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem className="justify-between" onClick={() => onChange("")}>
            <span>全部</span>
            {!value && <Check className="size-4" />}
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              className="justify-between"
              onClick={() => onChange(option)}
            >
              <span>{option}</span>
              {value === option && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CertificateFilterDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const label = value === "with" ? "证书: 有" : value === "without" ? "证书: 无" : "证书";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="ring-0!">
          <span>{label}</span>
          <ChevronDown strokeWidth={1} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem className="justify-between" onClick={() => onChange("")}>
            <span>全部</span>
            {!value && <Check className="size-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between" onClick={() => onChange("with")}>
            <span>有证书</span>
            {value === "with" && <Check className="size-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between" onClick={() => onChange("without")}>
            <span>无证书</span>
            {value === "without" && <Check className="size-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof FileCheck2;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="admin-asset-summary-card gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold">{value}</div>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="text-sm text-neutral-500">{description}</div>
    </Card>
  );
}

function AssetRow({
  asset,
  onEditOffchain,
}: {
  asset: ProductAsset;
  onEditOffchain: (assetId: string) => void;
}) {
  const detailHref = `/admin/asset/${asset.id}`;

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-[260px] items-center gap-3">
          <img
            src={asset.imageURL}
            alt={getProductAssetDisplayName(asset)}
            className="size-12 rounded-md border bg-sky-50 object-cover"
          />
          <div className="min-w-0">
            <Link to={detailHref} className="font-semibold hover:underline">
              {asset.id}
            </Link>
            <div className="truncate text-sm text-muted-foreground">
              {getProductAssetDisplayName(asset)}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{asset.categoryLabel}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{asset.sellerCategoryLabel}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={getAssetChainStatusClassName(asset.chainStatus)}>
          {getAssetChainStatusLabel(asset.chainStatus)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="min-w-[120px]">
          <div>{asset.spec || "-"}</div>
          {asset.size ? <div className="text-xs text-muted-foreground">{asset.size}</div> : null}
        </div>
      </TableCell>
      <TableCell>
        <AssetPriceCell asset={asset} />
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>图片 {asset.imageURLs.length}</div>
          <div className="text-muted-foreground">证书 {asset.certificateURLs.length}</div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="更多操作">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to={detailHref}>
                  <Eye />
                  查看
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEditOffchain(asset.id)}>
                <Pencil />
                维护链下资料
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/asset/${asset.id}`} target="_blank" rel="noreferrer">
                <ExternalLink />
                前台查看
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function AssetPriceCell({ asset }: { asset: ProductAsset }) {
  const hasCnyPrice = Number.isFinite(asset.priceCny) && asset.priceCny > 0;
  const pricePhenix = asset.pricePhenix?.trim();

  return (
    <div className="min-w-[120px]">
      <div>{hasCnyPrice ? formatProductAssetPrice(asset.priceCny) : "待维护"}</div>
      {pricePhenix ? (
        <div className="text-xs text-muted-foreground">
          {formatRwaPrice(pricePhenix)} PHENIX
        </div>
      ) : null}
    </div>
  );
}
