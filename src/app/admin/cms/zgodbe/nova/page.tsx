import { ZgodbeEditor } from "@/components/admin/cms/ZgodbeEditor";

export default function NewZgodbaPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-forest-900 tracking-tight">Nov prispevek</h2>
        <p className="text-earth-500 font-medium mt-1">Napišite briljantno vsebino.</p>
      </div>
      <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-sm border border-earth-100 overflow-hidden">
        <ZgodbeEditor />
      </div>
    </div>
  );
}
