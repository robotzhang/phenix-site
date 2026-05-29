import { Link, useParams, type LoaderFunctionArgs } from "react-router";
import {
  BadgeCheck,
  ExternalLink,
  FileCheck2,
  Hash,
  Images,
  PackageCheck,
  Pencil,
  Ruler,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatProductAssetPrice,
  getMergedProductAssetById,
  getProductAssetDisplayName,
} from "@/data/product-assets";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import { AssetBreadcrumb, AssetHeader } from "./asset/shared";

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminPage(context, request);
  return null;
}

export function meta() {
  return [
    { title: "资产详情 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminAssetDetail() {
  const { assetId } = useParams();
  const adminMetadataMap = useRwaAdminMetadataMap();
  const asset = getMergedProductAssetById(assetId, adminMetadataMap);

  if (!asset) {
    return (
      <div className="min-h-screen bg-neutral-100 text-neutral-950">
        <AssetHeader
          title="资产详情"
          leading={<AssetBreadcrumb items={[{ label: "资产库", to: "/admin/asset" }, { label: "未找到" }]} />}
        />
        <main className="mx-auto max-w-4xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>资产不存在</CardTitle>
              <CardDescription>没有找到这个资产编号，或后台资料还在加载。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/admin/asset">
                  返回资产列表
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const displayName = getProductAssetDisplayName(asset);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader
        title="资产详情"
        leading={<AssetBreadcrumb items={[{ label: "资产库", to: "/admin/asset" }, { label: asset.id }]} />}
      >
        <Button asChild size="sm">
          <Link to={`/admin/asset/${asset.id}/edit`}>
            <Pencil />
            编辑
          </Link>
        </Button>
      </AssetHeader>

      <main className="mx-auto grid max-w-7xl gap-4 p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-sky-50">
            <img
              src={asset.imageURL}
              alt={displayName}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 rounded-md border bg-white/90 px-3 py-1 text-sm font-semibold shadow-sm">
              {asset.id}
            </div>
            {asset.certificateURLs.length > 0 ? (
              <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-white/90 px-3 py-1 text-sm font-semibold text-emerald-700 shadow-sm">
                <BadgeCheck className="size-4" />
                已关联证书
              </div>
            ) : null}
          </div>
          <CardContent className="grid gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{asset.categoryLabel}</Badge>
              <Badge variant="secondary">{asset.sellerCategoryLabel}</Badge>
              <Badge variant="outline">产品资产</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
              <div className="mt-3 text-3xl font-semibold text-sky-950">
                {formatProductAssetPrice(asset.priceCny)}
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={`/asset/${asset.id}`} target="_blank" rel="noreferrer">
                <ExternalLink />
                前台查看
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5" />
                基础资料
              </CardTitle>
              <CardDescription>前台资产库展示和第三方资料索引用字段。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={PackageCheck} label="规格" value={asset.spec || "-"} />
              <InfoItem icon={Ruler} label="尺寸" value={asset.size || "-"} />
              <InfoItem icon={Images} label="产品图片" value={`${asset.imageURLs.length} 张`} />
              <InfoItem icon={BadgeCheck} label="证书影像" value={`${asset.certificateURLs.length} 张`} />
              <InfoItem icon={Hash} label="文件包 hash" value={asset.fileHash || "-"} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>产品图片</CardTitle>
              <CardDescription>第一张图片作为资产封面。</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageGrid urls={asset.imageURLs} title={displayName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>证书 / 确权资料</CardTitle>
              <CardDescription>用于展示证书、确权资料和托管文件截图。</CardDescription>
            </CardHeader>
            <CardContent>
              {asset.certificateURLs.length > 0 ? (
                <ImageGrid urls={asset.certificateURLs} title={`${displayName} 证书`} />
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  暂无证书影像。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: typeof PackageCheck;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-1 break-all font-medium">{value}</div>
    </div>
  );
}

function ImageGrid({ urls, title }: { urls: string[]; title: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {urls.map((url, index) => (
        <div key={url} className="relative overflow-hidden rounded-lg border bg-sky-50">
          <img src={url} alt={`${title} ${index + 1}`} className="aspect-square w-full object-cover" />
          <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold shadow-sm">
            {index === 0 ? "封面" : index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
