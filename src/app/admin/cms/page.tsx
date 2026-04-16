import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";

export default function CMSDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-forest-900 tracking-tight">Vsebinski motor</h2>
          <p className="text-earth-500 font-medium mt-1">Upravljanje zgodb in novic na platformi</p>
        </div>
        <Link 
          href="/admin/cms/zgodbe/nova"
          className="flex items-center gap-2 rounded-xl bg-forest-900 text-white font-bold py-3 px-5 hover:bg-forest-800 transition-all shadow hover:shadow-lg"
        >
          <PlusCircle size={18} />
          Nova Objava
        </Link>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* We can list recent drafts here later */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-earth-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 flex items-center justify-center text-forest-600">
            <Pencil size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-forest-900">Začni z novo vsebino</h3>
            <p className="text-earth-500 text-sm">Jože bo pripravljen, da vam pomaga urediti objavo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
