import MemeFaq from "./Meme/Faq";

export default function Meme() {
  return (
    <div>
      <div>price chart</div>
      <div>buy form</div>
      <div>recent buy</div>
      
      <div className="py-10 sm:py-20 max-w-5xl m-auto">
        <h2 className="text-3xl font-semibold mb-2 sm:mb-6">FQA</h2>
        <MemeFaq />
      </div>
      
      <div>exchange</div>
    </div>
  );
}
