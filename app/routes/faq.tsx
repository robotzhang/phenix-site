import FQA from "@/components/biz/FQA";

export function meta() {
  return [
    { title: "FAQ | PHENIX" },
    { name: "description", content: "了解 PHENIX 项目、会员体系、服务卡、积分用途和流通边界。" },
  ];
}

export default function Faq() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-14 sm:px-0 sm:py-20">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">FAQ</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">常见问题</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            先了解 PHENIX 为什么存在、适合谁参与，再进一步理解会员权益、服务卡、PHENIX 积分和流通边界。
          </p>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-0 sm:py-20">
        <FQA />
      </section>
    </div>
  );
}
