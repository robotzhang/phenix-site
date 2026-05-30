import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMergedProductAssetById,
  getProductAssetStorageKey,
  normalizeProductAssetCode,
} from "@/data/product-assets";
import {
  refreshRwaAdminMetadataMap,
  saveRwaAdminMetadata,
  useRwaAdminMetadataMap,
} from "@/lib/rwa-admin-storage";
import type { RwaAdminMetadataInput } from "@/lib/rwa-admin-storage.shared";
import {
  AssetBreadcrumb,
  AssetDatalists,
  AssetHeader,
  ProductAssetOffchainFields,
  createEmptyProductAssetForm,
  createProductAssetFormFromAsset,
  normalizeError,
  parsePositiveCurrency,
  type ProductAssetFormState,
} from "./shared";

type ValidatedOffchainMetadata = {
  assetCode: string;
  metadata: Pick<
    RwaAdminMetadataInput,
    | "assetKind"
    | "assetCode"
    | "categoryLabel"
    | "sellerCategoryLabel"
    | "spec"
    | "size"
    | "priceCny"
  >;
};

export function OffchainAssetEditor({
  assetId,
  mode,
  onClose,
  onSaved,
}: {
  assetId?: string;
  mode: "page" | "modal";
  onClose?: () => void;
  onSaved?: (assetCode: string) => void;
}) {
  const adminMetadataMap = useRwaAdminMetadataMap();
  const normalizedParamAssetId = useMemo(
    () => normalizeProductAssetCode(assetId || ""),
    [assetId],
  );
  const asset = useMemo(
    () => getMergedProductAssetById(assetId, adminMetadataMap),
    [adminMetadataMap, assetId],
  );
  const [form, setForm] = useState<ProductAssetFormState>(() =>
    asset
      ? createProductAssetFormFromAsset(asset)
      : createEmptyProductAssetForm(normalizedParamAssetId),
  );
  const [saving, setSaving] = useState(false);
  const isOnchain = form.chainStatus === "confirmed" && Boolean(form.chainTokenId);

  useEffect(() => {
    setForm(
      asset
        ? createProductAssetFormFromAsset(asset)
        : createEmptyProductAssetForm(normalizedParamAssetId),
    );
  }, [asset, normalizedParamAssetId]);

  const buildValidatedOffchainMetadata = (): ValidatedOffchainMetadata => {
    const assetCode = normalizeProductAssetCode(form.assetCode);
    const category = form.categoryLabel.trim();
    const sellerCategory = form.sellerCategoryLabel.trim();
    const spec = form.spec.trim();
    const size = form.size.trim();
    const priceCny = form.priceCny.trim();

    if (!assetCode) {
      throw new Error("请输入资产编号");
    }

    if (!category) {
      throw new Error("请输入资产类别");
    }

    if (!sellerCategory) {
      throw new Error("请输入来源标签");
    }

    if (!spec) {
      throw new Error("请输入规格");
    }

    if (!parsePositiveCurrency(priceCny)) {
      throw new Error("请输入正确的人民币会员价");
    }

    return {
      assetCode,
      metadata: {
        assetKind: "product",
        assetCode,
        categoryLabel: category,
        sellerCategoryLabel: sellerCategory,
        spec,
        size,
        priceCny,
      },
    };
  };

  const handleSave = async () => {
    let validated: ValidatedOffchainMetadata;

    try {
      validated = buildValidatedOffchainMetadata();
    } catch (error) {
      toast.error(normalizeError(error));
      return;
    }

    try {
      setSaving(true);
      await saveRwaAdminMetadata(
        getProductAssetStorageKey(validated.assetCode),
        validated.metadata,
      );
      await refreshRwaAdminMetadataMap();
      toast.success(`${validated.assetCode} 链下资料已保存`);
      onSaved?.(validated.assetCode);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setSaving(false);
    }
  };

  const lockAssetCode = Boolean(asset);
  const title = asset ? `维护链下资料 ${asset.id}` : "添加链下资料";
  const formBody = (
    <div className="grid gap-6">
      {isOnchain ? (
        <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          <span>
            该资产已完成链上，链上资料已锁定。这里只会更新会员价、资产类别、来源标签、规格和尺寸。
          </span>
        </div>
      ) : null}

      <ProductAssetOffchainFields
        form={form}
        setForm={setForm}
        disabled={saving}
        lockAssetCode={lockAssetCode}
      />
    </div>
  );
  const footerActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        className={
          mode === "modal"
            ? "text-sm leading-6 text-sky-900/60 sm:flex-1"
            : "border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-900/70 sm:flex-1"
        }
      >
        本次保存只会更新链下运营资料，不会修改链上资料。
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onClose ? (
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
        ) : null}
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <BadgeCheck className="h-4 w-4" />
          )}
          保存链下资料
        </Button>
      </div>
    </div>
  );

  if (mode === "modal") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-[82vh] w-full max-w-4xl flex-col overflow-hidden border bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <div className="text-lg font-semibold text-sky-950">{title}</div>
              <p className="mt-1 text-sm text-sky-900/60">
                只维护链下运营资料，链上字段不在这里编辑。
              </p>
            </div>
            {onClose ? (
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="关闭弹窗">
                <X className="size-5" />
              </Button>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{formBody}</div>
          <div className="shrink-0 border-t bg-white px-6 py-4">{footerActions}</div>
        </div>
        <AssetDatalists />
      </div>
    );
  }

  const breadcrumbItems = asset
    ? [
        { label: "资产库", to: "/admin/asset" },
        { label: asset.id, to: `/admin/asset/${asset.id}` },
        { label: "编辑链下资料" },
      ]
    : [
        { label: "资产库", to: "/admin/asset" },
        { label: "添加链下资料" },
      ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader title={title} leading={<AssetBreadcrumb items={breadcrumbItems} />}>
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />}
          保存链下资料
        </Button>
      </AssetHeader>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>链下资料</CardTitle>
            <CardDescription>
              这里仅维护会员价、资产类别、来源标签、规格和尺寸。链上资料请在资产详情页的“链上”弹窗中维护。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {formBody}
            {footerActions}
          </CardContent>
        </Card>
      </main>

      <AssetDatalists />
    </div>
  );
}
