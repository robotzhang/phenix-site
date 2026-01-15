import GlobalLoading from "@/components/ui/global-loading";
import { useRwaList } from "@/hooks/useRwa";
import { Link } from "react-router";

export default function RwaList() {
  const { data: rwas, loading } = useRwaList();
  //
  return (
    <div className="md:max-w-5xl sm:max-w-3xl mx-auto px-6">
      <h1 className="text-2xl font-bold mb-4">All RWA Assets</h1>
      <div className="grid grid-cols-12 gap-6">
        <div className="md:col-span-4 sm:col-span-3 col-span-2">
          {(rwas || []).map((rwa) => (
            <Link
              key={rwa.tokenId.toString()}
              to={`/rwa/${rwa.tokenId}`}
              className="block p-4 rounded-xl bg-white shadow"
            >
              <img src={rwa.imageURL} alt={rwa.asset.name} className="w-full h-auto mb-4 rounded" />
              <div className="font-bold">{rwa.asset.name}</div>
              <div>Floor Price: {rwa.asset.pricePhenixFormatted} PHENIX</div>
              <div>Status: {rwa.asset.status === 0 ? "Published" : "Unpublished"}</div>
            </Link>
          ))}
        </div>
      </div>

      {loading && <GlobalLoading />}
    </div>
  );
}
