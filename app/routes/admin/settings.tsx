import { Settings2 } from "lucide-react";

export function meta() {
  return [
    { title: "通用设置 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminSettings() {
  return (
    <div className="min-h-screen bg-neutral-100 px-6 py-6 text-neutral-950">
      <div className="mx-auto max-w-6xl">
        <section className="border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
              <Settings2 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">通用设置</h1>
              <p className="mt-1 text-sm text-neutral-500">
                后续后台通用配置会集中放在这里。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
