import GlobalLoading from "@/components/ui/global-loading";
import { useRwaList } from "@/hooks/useRwa";
import { formatRwaPriceWithCurrency } from "@/lib/rwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import { Link } from "react-router";
import {
  ArrowRight,
  CircleAlert,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function RwaList() {
  const { data: rwas, loading } = useRwaList();
  const adminMetadataMap = useRwaAdminMetadataMap();
  const published = (rwas || []).filter((rwa) => rwa.asset.status === 0).length;

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Asset Pool
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
              文化艺术品资产库
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
              PHENIX 不卖单品，而是构建可配置资产库。每一项上链资产都关联文件包
              hash、权属记录与资产状态，用于支撑后续托管、流通与会员配置服务。
            </p>
          </div>
          <div className="grid grid-cols-3 border border-sky-100 bg-white/90 shadow-sm">
            <div className="border-r border-sky-100 p-4">
              <div className="text-2xl font-semibold text-sky-950">
                {rwas?.length || 0}
              </div>
              <div className="mt-1 text-sm text-sky-900/60">链上资产</div>
            </div>
            <div className="border-r border-sky-100 p-4">
              <div className="text-2xl font-semibold text-sky-950">
                {published}
              </div>
              <div className="mt-1 text-sm text-sky-900/60">已发布</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-semibold text-sky-950">Base</div>
              <div className="mt-1 text-sm text-sky-900/60">链上网络</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-b border-sky-100 bg-[linear-gradient(180deg,#f7fbfd_0%,#edf6fb_100%)] px-4 py-8 text-sky-950 sm:px-8 md:grid-cols-3">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-sky-700" />
          <div>
            <h2 className="font-semibold">严选入库</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900/70">
              围绕真伪、稀缺性、历史意义与流通能力进行多层评估。
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <LockKeyhole className="mt-1 h-5 w-5 text-sky-700" />
          <div>
            <h2 className="font-semibold">托管优先</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900/70">
              资产信息展示服务于后续第三方托管、保险与流通服务。
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <FileCheck2 className="mt-1 h-5 w-5 text-sky-700" />
          <div>
            <h2 className="font-semibold">链上存证</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900/70">
              通过 Token ID 与文件包 hash 记录资产核心索引。
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-0 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-sky-950">资产列表</h2>
          <div className="flex items-center gap-2 border border-sky-100 bg-white/80 px-3 py-2 text-sm text-sky-900/60 shadow-sm">
            <CircleAlert className="h-4 w-4" />
            严选文化艺术品资产
          </div>
        </div>

        {(rwas || []).length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(rwas || []).map((rwa) => (
              <Link
                key={rwa.tokenId.toString()}
                to={`/rwa/${rwa.tokenId}`}
                className="group overflow-hidden border border-sky-100 bg-white/90 shadow-sm transition hover:border-sky-300"
              >
                <div className="aspect-[4/3] overflow-hidden bg-sky-50">
                  <img
                    src={rwa.imageURL}
                    alt={rwa.asset.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex border border-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                        {adminMetadataMap[rwa.tokenId.toString()]?.categoryLabel ?? rwa.categoryLabel}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-sky-950">
                        {rwa.asset.name}
                      </h3>
                    </div>
                    <span className="shrink-0 border border-sky-100 px-2 py-1 text-xs text-sky-900/60">
                      {adminMetadataMap[rwa.tokenId.toString()]?.sellerCategoryLabel ?? rwa.sellerCategoryLabel}
                    </span>
                  </div>
                  <div className="mt-5 border-t border-sky-100 pt-4">
                    <div className="text-sm text-sky-900/60">会员价</div>
                    <div className="mt-1 text-2xl font-semibold text-sky-950">
                      {formatRwaPriceWithCurrency(
                        rwa.asset.pricePhenixFormatted,
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-sky-900/70">
                    <span className="max-w-[70%] truncate">
                      Hash {rwa.asset.fileHash}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-950">
                      查看详情
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {(rwas || []).length === 0 && !loading && (
          <div className="border border-sky-100 bg-white/90 px-6 py-16 text-center text-sky-900/60">
            文化艺术品正在准备上传中
          </div>
        )}

        {loading && <GlobalLoading />}
      </section>
    </div>
  );
}
