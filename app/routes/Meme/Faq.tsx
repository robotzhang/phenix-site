import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FQAS = [
  { q: 'What is Phenix Meme?', a: 'Phenix Meme' },
  { q: 'How can i get phenix by meme?', a: 'Redeem' },
  { q: 'Can i exchange my phenix meme?', a: 'Yes' }
];

export default function MemeFaq() {
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