import Link from "next/link";
import { ShieldCheck, Sparkles, Waves } from "lucide-react";

const gallery = [
  "thietbi1.jpg",
  "thietbi2.webp",
  "lophoc.jpg",
  "huanluyenvien.webp",
  "OIP (1).webp",
  "OIP (2).webp",
];

export default function FacilitiesPage() {
  return (
    <section>
      <div className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-10">
          <h1 className="text-4xl font-black">Cơ Sở Vật Chất</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">
            Không gian tập luyện hiện đại, thiết bị cao cấp và môi trường chuyên nghiệp.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {gallery.map((image) => (
            <div
              key={image}
              className="h-64 rounded-xl bg-cover bg-center shadow-sm"
              style={{ backgroundImage: `url('/img/csvc/${image}')` }}
            />
          ))}
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "An toàn & sạch sẽ" },
            { icon: Sparkles, title: "Thiết bị hiện đại" },
            { icon: Waves, title: "Không gian đa năng" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border-soft bg-white p-6 shadow-sm"
            >
              <item.icon className="mb-4 text-primary" />
              <h2 className="text-lg font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Bố trí tối ưu cho tập cá nhân, lớp nhóm, yoga, cardio và strength training.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/services"
            className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-black text-white"
          >
            Xem khóa học
          </Link>
        </div>
      </div>
    </section>
  );
}
