import { HeartHandshake, Landmark, Leaf, ShieldCheck } from "lucide-react";

const communityValues = [
  {
    title: "传承",
    text: "聚焦根祖文化与红色文化的传播，传承中华文脉。",
  },
  {
    title: "康养",
    text: "聚焦普通人的健康需求，打造普惠康养服务。",
  },
  {
    title: "共富",
    text: "让每一位参与者都能共享生态发展红利。",
  },
  {
    title: "实干",
    text: "拒绝空谈、注重落地，以实际行动推动事业发展。",
  },
  {
    title: "良知",
    text: "坚守良知生产、诚信经营，不搞虚假宣传、不追求短期暴利。",
  },
];

const etiquetteItems = ["问候礼仪", "沟通礼仪", "服务礼仪"];

export function meta() {
  return [
    { title: "社区成员守则 | PHENIX" },
    { name: "description", content: "龙凤呈祥社区成员守则，包含核心使命、价值关键词与礼仪文化。" },
  ];
}

export default function CommunityCode() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-16 sm:px-0 sm:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Community Code</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
            “龙凤呈祥社区”成员守则
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            以“传承中华文脉、引领健康生活、实现圈层共富”为核心使命。
          </p>
        </div>
      </section>

      <section className="border-b border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Core Values</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">核心价值关键词</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {communityValues.map((item) => (
              <article key={item.title} className="border border-sky-100 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-sky-700">{item.title}</div>
                <p className="mt-3 text-sm leading-7 text-sky-900/70">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border border-sky-100 bg-sky-50/70 p-6">
            <HeartHandshake className="h-7 w-7 text-sky-700" />
            <h2 className="mt-5 text-3xl font-semibold text-sky-950">礼仪文化</h2>
            <p className="mt-4 leading-8 text-sky-900/70">
              核心是“礼敬他人、敬畏祖先、规范言行”。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="border border-sky-100 bg-white p-5 shadow-sm">
              <Landmark className="h-6 w-6 text-sky-700" />
              <h3 className="mt-4 font-semibold text-sky-950">言行端庄</h3>
              <p className="mt-3 text-sm leading-7 text-sky-900/70">
                热情礼貌、耐心周到，尊重他人的意见与需求。
              </p>
            </article>
            <article className="border border-sky-100 bg-white p-5 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-sky-700" />
              <h3 className="mt-4 font-semibold text-sky-950">服务规范</h3>
              <p className="mt-3 text-sm leading-7 text-sky-900/70">
                坚守岗位规范，真诚友善，不推诿、不敷衍。
              </p>
            </article>
            <article className="border border-sky-100 bg-white p-5 shadow-sm">
              <Leaf className="h-6 w-6 text-sky-700" />
              <h3 className="mt-4 font-semibold text-sky-950">文明有礼</h3>
              <p className="mt-3 text-sm leading-7 text-sky-900/70">
                公共场合遵守秩序，自觉维护社区与品牌形象。
              </p>
            </article>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {etiquetteItems.map((item) => (
            <span key={item} className="border border-sky-100 bg-white px-3 py-2 font-semibold text-sky-800">
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
