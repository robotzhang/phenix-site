import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FQAS = [
  { q: 'What is Phenix RWA?', a: 'Phenix RWA' },
  { q: 'What is Phenix F-NFT?', a: 'Phenix F-NFT' },
  { q: 'F-NFT holder rights', a: 'Phenix F-NFT' }
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