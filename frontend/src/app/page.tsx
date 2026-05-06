import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">
          Epson Internal Help Desk
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Selamat datang di sistem helpdesk internal Epson. Ajukan tiket dukungan atau
          gunakan asisten AI untuk menjawab pertanyaan seputar prosedur manufaktur sintetik.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          href="/tickets"
          className="flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">🎫</span>
          <h2 className="text-xl font-semibold text-gray-800">Tiket Dukungan</h2>
          <p className="text-sm text-gray-500">
            Buat dan kelola tiket dukungan teknis untuk masalah yang Anda temui.
          </p>
        </Link>

        <Link
          href="/chat"
          className="flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">🤖</span>
          <h2 className="text-xl font-semibold text-gray-800">Asisten AI</h2>
          <p className="text-sm text-gray-500">
            Tanya jawab langsung dengan asisten AI yang didukung oleh SOP manufaktur
            sintetik Epson.
          </p>
        </Link>

        <Link
          href="/knowledge-base"
          className="flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">📚</span>
          <h2 className="text-xl font-semibold text-gray-800">Knowledge Base</h2>
          <p className="text-sm text-gray-500">
            Akses perpustakaan SOP dan panduan prosedur manufaktur sintetik.
          </p>
        </Link>
      </div>
    </div>
  );
}
