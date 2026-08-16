import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-6">
          <div className="bg-emerald-500 text-white p-2 rounded-lg font-bold">
            🏠
          </div>
          <span className="font-bold text-lg text-white">Tindahan</span>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-600 text-white font-medium">
            Dashboard
          </Link>
          <Link href="/sales" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Sales / POS
          </Link>
          <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Products
          </Link>
          <Link href="/customers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Customers
          </Link>
          <Link href="/utang" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Utang Ledger
          </Link>
          <Link href="/payments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Payments
          </Link>
          <Link href="/digital-services" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Digital Services
          </Link>
        </nav>
      </div>

      {/* User Footer */}
      <div className="pt-4 border-t border-slate-800 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
          N
        </div>
        <div className="text-xs">
          <p className="font-semibold text-white">Sari-Sari Store</p>
          <p className="text-slate-500">Management</p>
        </div>
      </div>
    </aside>
  );
}