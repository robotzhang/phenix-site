import { useEffect, useState } from "react";
import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router";
import { BadgeCheck, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getMergedProductAssetById,
  getProductAssetStorageKey,
  normalizeProductAssetCode,
} from "@/data/product-assets";
import {
  refreshRwaAdminMetadataMap,
  saveRwaAdminMetadata,
  uploadRwaAdminImage,
  useRwaAdminMetadataMap,
} from "@/lib/rwa-admin-storage";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import {
  AssetBreadcrumb,
  AssetDatalists,
  AssetHeader,
  MAX_CATALOG_IMAGES,
  MAX_CERTIFICATE_IMAGES,
  ProductAssetFields,
  ProductAssetImageUploader,
  ProductAssetPreviewCard,
  compressProductImage,
  createEmptyProductAssetForm,
  createProductAssetFormFromAsset,
  normalizeError,
  normalizeImageURLList,
  parsePositiveCurrency,
  type ProductAssetFormState,
} from "./asset/shared";

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminPage(context, request);
  return null;
}

export function meta() {
  return [
    { title: "编辑资产 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminAssetEdit() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const adminMetadataMap = useRwaAdminMetadataMap();
  const asset = getMergedProductAssetById(assetId, adminMetadataMap);
  const normalizedParamAssetId = normalizeProductAssetCode(assetId || "");
  const [form, setForm] = useState<ProductAssetFormState>(() =>
    asset
      ? createProductAssetFormFromAsset(asset)
      : createEmptyProductAssetForm(normalizedParamAssetId),
  );
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [uploadingCertificateImages, setUploadingCertificateImages] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setForm(createProductAssetFormFromAsset(asset));
    }
  }, [asset]);

  const handleUploadImages = async (
    files: FileList | null,
    target: "product" | "certificate",
  ) => {
    if (!files?.length) return;

    const currentURLs = target === "product" ? form.imageURLs : form.certificateURLs;
    const maxImages = target === "product" ? MAX_CATALOG_IMAGES : MAX_CERTIFICATE_IMAGES;
    const remaining = maxImages - currentURLs.length;

    if (remaining <= 0) {
      toast.error(`最多上传 ${maxImages} 张图片`);
      return;
    }

    try {
      if (target === "product") {
        setUploadingProductImages(true);
      } else {
        setUploadingCertificateImages(true);
      }

      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const compressed = await compressProductImage(file);
        uploaded.push(await uploadRwaAdminImage(compressed));
      }

      setForm((current) => ({
        ...current,
        [target === "product" ? "imageURLs" : "certificateURLs"]: normalizeImageURLList(
          [...currentURLs, ...uploaded],
          maxImages,
        ),
      }));
      toast.success(`已上传 ${uploaded.length} 张${target === "product" ? "产品图片" : "证书图片"}`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setUploadingProductImages(false);
      setUploadingCertificateImages(false);
    }
  };

  const removeImageURL = (imageURL: string, target: "product" | "certificate") => {
    setForm((current) => ({
      ...current,
      [target === "product" ? "imageURLs" : "certificateURLs"]: current[
        target === "product" ? "imageURLs" : "certificateURLs"
      ].filter((item) => item !== imageURL),
    }));
  };

  const setCoverImage = (imageURL: string) => {
    setForm((current) => ({
      ...current,
      imageURLs: [
        imageURL,
        ...current.imageURLs.filter((item) => item !== imageURL),
      ],
    }));
  };

  const handleSave = async () => {
    const assetCode = normalizeProductAssetCode(form.assetCode);
    const name = form.name.trim();
    const category = form.categoryLabel.trim();
    const sellerCategory = form.sellerCategoryLabel.trim();
    const spec = form.spec.trim();
    const size = form.size.trim();
    const priceCny = form.priceCny.trim();
    const fileHash = form.fileHash.trim();
    const imageURLs = normalizeImageURLList(form.imageURLs, MAX_CATALOG_IMAGES);
    const certificateURLs = normalizeImageURLList(
      form.certificateURLs,
      MAX_CERTIFICATE_IMAGES,
    );

    if (!assetCode) {
      toast.error("请输入资产编号");
      return;
    }

    if (!name) {
      toast.error("请输入资产名称");
      return;
    }

    if (!category) {
      toast.error("请输入资产类别");
      return;
    }

    if (!sellerCategory) {
      toast.error("请输入来源标签");
      return;
    }

    if (!spec) {
      toast.error("请输入规格");
      return;
    }

    if (!parsePositiveCurrency(priceCny)) {
      toast.error("请输入正确的人民币会员价");
      return;
    }

    if (!fileHash) {
      toast.error("请输入文件包 hash");
      return;
    }

    if (imageURLs.length < 1) {
      toast.error("请至少上传 1 张产品图片");
      return;
    }

    try {
      setSaving(true);
      await saveRwaAdminMetadata(getProductAssetStorageKey(assetCode), {
        assetKind: "product",
        assetCode,
        name,
        categoryLabel: category,
        sellerCategoryLabel: sellerCategory,
        spec,
        size,
        priceCny,
        fileHash,
        imageURL: imageURLs[0],
        imageURLs,
        certificateURLs,
      });
      await refreshRwaAdminMetadataMap();
      toast.success(`${assetCode} 已保存`);
      navigate(`/admin/asset/${assetCode}`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setSaving(false);
    }
  };

  const title = asset ? `编辑 ${asset.id}` : "添加资产";
  const breadcrumbItems = asset
    ? [
      { label: "资产库", to: "/admin/asset" },
      { label: asset.id, to: `/admin/asset/${asset.id}` },
      { label: "编辑" },
    ]
    : [
      { label: "资产库", to: "/admin/asset" },
      { label: "添加资产" },
    ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader title={title} leading={<AssetBreadcrumb items={breadcrumbItems} />}>
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />}
          保存
        </Button>
      </AssetHeader>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>资产资料</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <ProductAssetFields form={form} setForm={setForm} />

            <ProductAssetImageUploader
              title="产品图片"
              description="第一张作为资产封面，可上传多角度图片。"
              imageURLs={form.imageURLs}
              maxImages={MAX_CATALOG_IMAGES}
              uploading={uploadingProductImages}
              onUpload={(files) => void handleUploadImages(files, "product")}
              onRemove={(imageURL) => removeImageURL(imageURL, "product")}
              onCover={setCoverImage}
            />

            <ProductAssetImageUploader
              title="证书 / 确权资料图片"
              description="上传证书、确权资料、托管文件截图等影像。"
              imageURLs={form.certificateURLs}
              maxImages={MAX_CERTIFICATE_IMAGES}
              uploading={uploadingCertificateImages}
              onUpload={(files) => void handleUploadImages(files, "certificate")}
              onRemove={(imageURL) => removeImageURL(imageURL, "certificate")}
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-900/70">
                保存后会写入后台存储，并覆盖前台资产库对应编号的展示资料。
              </div>
              <Button
                className="h-full"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                保存资产资料
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-sky-700" />
              资产卡片预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductAssetPreviewCard form={form} />
          </CardContent>
        </Card>
      </main>

      <AssetDatalists />
    </div>
  );
}
