import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FQAS = [
  {
    q: "PHENIX 会员凭证是什么？",
    a: "会员凭证是进入 PHENIX 文化艺术品资产配置生态的链上凭证，用于连接会员身份、资产配置服务与后续生态权益。",
  },
  {
    q: "持有会员凭证可以获得哪些权益？",
    a: "权益包括资产配置服务、圈层资源对接、项目合作机会和优先流通支持。具体权益以平台实际规则与服务能力为准。",
  },
  {
    q: "会员凭证是否代表固定收益？",
    a: "不代表。PHENIX 不公开募资，不承诺收益。文化艺术品资产价格会受市场、资产状态、流通渠道和宏观环境影响。",
  },
  {
    q: "为什么需要连接钱包？",
    a: "连接钱包用于读取账户资产、支付 USDT 并接收链上会员凭证。未连接钱包时，部分公开信息仍可浏览。",
  },
];

export default function FQAComponent() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      // defaultValue="item-1"
    >
      {FQAS.map((item, index) => (
        <AccordionItem key={item.q} value={`item-${index + 1}`}>
          <AccordionTrigger className="text-lg">{item.q}</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance font-base">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
