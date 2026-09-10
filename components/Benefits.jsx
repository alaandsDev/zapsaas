import Reveal from "./ui/Reveal";
import Icon from "./ui/Icon";

export default function Benefits({ title, subtitle, items }) {
  return (
    <section className="bg-[#ECEEF2] border-y border-[#E4E7EC] py-24">
      <div className="container-x relative">
        <Reveal className="max-w-2xl mb-14">
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            Por que Wayvo
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            {title}
          </h2>
          {subtitle && <p className="mt-4 text-[#4B5565] text-[17px] leading-relaxed">{subtitle}</p>}
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((b, i) => (
            <Reveal key={i} delay={Math.min(i * 70, 210)} className="h-full">
              <div
                className="h-full rounded-[18px] bg-white border border-[#E9ECF1] p-6 transition-all duration-200 hover:-translate-y-1 shadow-[0_4px_14px_-8px_rgba(10,16,32,0.14)] hover:shadow-[0_16px_34px_-16px_rgba(10,16,32,0.22)]"
              >
                <div className="size-[42px] rounded-xl bg-[#EAFBF1] border border-[#D2F0E0] flex items-center justify-center text-[#0E8A47] mb-4">
                  <Icon name={b.icon} className="size-[21px]" strokeWidth={2} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#0A1020] leading-snug">{b.title}</h3>
                <p className="text-[14.5px] text-[#5A6474] mt-2 leading-relaxed">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
