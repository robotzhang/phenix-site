import GlobalLoading from "@/components/ui/global-loading";
import { useRwaList } from "@/hooks/useRwa";
import { Link } from "react-router";
import { ArrowRight, FileCheck2, LockKeyhole, Search, ShieldCheck } from "lucide-react";

function formatCompactNumber(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: num >= 1000 ? 0 : 2,
  }).format(num);
}

export default function RwaList() {
  const { data: rwas, loading } = useRwaList();
  const published = (rwas || []).filter((rwa) => rwa.asset.status === 0).length;

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-neutral-200 bg-white px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Asset Pool</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-neutral-950 sm:text-6xl">文化资产池</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600">
              PHENIX 不卖单品，而是构建可配置资产池。每一项上链资产都关联文件包 hash、权属记录与资产状态，用于支撑后续托管、流通与会员配置服务。
            </p>
          </div>
          <div className="grid grid-cols-3 border border-neutral-200 bg-neutral-50">
            <div className="border-r border-neutral-200 p-4">
              <div className="text-2xl font-semibold text-neutral-950">{rwas?.length || 0}</div>
              <div className="mt-1 text-sm text-muted-foreground">链上资产</div>
            </div>
            <div className="border-r border-neutral-200 p-4">
              <div className="text-2xl font-semibold text-neutral-950">{published}</div>
              <div className="mt-1 text-sm text-muted-foreground">已发布</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-semibold text-neutral-950">Base</div>
              <div className="mt-1 text-sm text-muted-foreground">链上网络</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-b border-neutral-200 bg-neutral-950 px-4 py-8 text-white sm:px-8 md:grid-cols-3">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-red-300" />
          <div>
            <h2 className="font-semibold">严选入池</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">围绕真伪、稀缺性、历史意义与流通能力进行多层评估。</p>
          </div>
        </div>
        <div className="flex gap-3">
          <LockKeyhole className="mt-1 h-5 w-5 text-red-300" />
          <div>
            <h2 className="font-semibold">托管优先</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">资产信息展示服务于后续第三方托管、保险与流通服务。</p>
          </div>
        </div>
        <div className="flex gap-3">
          <FileCheck2 className="mt-1 h-5 w-5 text-red-300" />
          <div>
            <h2 className="font-semibold">链上存证</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">通过 Token ID 与文件包 hash 记录资产核心索引。</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-0 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-neutral-950">资产列表</h2>
          <div className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            严选文化资产与链上凭证
          </div>
        </div>

        {(rwas || []).length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(rwas || []).map((rwa) => (
              <Link
                key={rwa.tokenId.toString()}
                to={`/rwa/${rwa.tokenId}`}
                className="group overflow-hidden border border-neutral-200 bg-white transition hover:border-neutral-950"
              >
                <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                  <img
                    src={rwa.imageURL}
                    alt={rwa.asset.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-red-700">RWA #{rwa.tokenId.toString()}</div>
                      <h3 className="mt-2 text-xl font-semibold text-neutral-950">{rwa.asset.name}</h3>
                    </div>
                    <span className="shrink-0 border border-neutral-200 px-2 py-1 text-xs text-neutral-600">
                      {rwa.asset.status === 0 ? "已发布" : "未发布"}
                    </span>
                  </div>
                  <div className="mt-5 border-t border-neutral-200 pt-4">
                    <div className="text-sm text-muted-foreground">PHENIX 定价</div>
                    <div className="mt-1 text-2xl font-semibold text-neutral-950">
                      {formatCompactNumber(rwa.asset.pricePhenixFormatted)}
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-neutral-600">
                    <span className="max-w-[70%] truncate">Hash {rwa.asset.fileHash}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-neutral-950">
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
          <div className="border border-neutral-200 bg-white px-6 py-16 text-center text-gray-500">
            当前暂无链上 RWA 资产。
          </div>
      )}

      {loading && <GlobalLoading />}
      </section>
    </div>
  );
}
