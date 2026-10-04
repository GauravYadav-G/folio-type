import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { EASE, Marquee, MaskLines, Reveal } from "./lib/kit";

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */
type Axis = { tag: string; label: string; min: number; max: number; step: number; def: number };
type Family = {
  id: "tarn" | "bruit" | "casa";
  name: string;
  font: string;
  kind: string;
  blurb: string;
  axes: Axis[];
  rest: string;
  peak: string;
  price: number;
};

const FAMILIES: Family[] = [
  {
    id: "tarn",
    name: "Tarn",
    font: '"Anybody"',
    kind: "Display · width & weight",
    blurb: "A display face that goes from a hairline sliver to a wide black slab without changing its mind.",
    axes: [
      { tag: "wght", label: "Weight", min: 100, max: 900, step: 1, def: 400 },
      { tag: "wdth", label: "Width", min: 50, max: 150, step: 1, def: 100 },
    ],
    rest: '"wght" 200, "wdth" 60',
    peak: '"wght" 900, "wdth" 150',
    price: 120,
  },
  {
    id: "bruit",
    name: "Bruit",
    font: '"Bricolage Grotesque"',
    kind: "Grotesque · optical size",
    blurb: "Quiet at text sizes, opinionated at display sizes. The optical axis does the arguing for you.",
    axes: [
      { tag: "wght", label: "Weight", min: 200, max: 800, step: 1, def: 500 },
      { tag: "wdth", label: "Width", min: 75, max: 100, step: 1, def: 100 },
      { tag: "opsz", label: "Optical size", min: 12, max: 96, step: 1, def: 48 },
    ],
    rest: '"wght" 300, "wdth" 100, "opsz" 12',
    peak: '"wght" 800, "wdth" 75, "opsz" 96',
    price: 90,
  },
  {
    id: "casa",
    name: "Casa",
    font: '"Recursive"',
    kind: "Sans · casual & mono",
    blurb: "A sans that turns into a monospace, and from linear to casual, when the layout asks it to.",
    axes: [
      { tag: "wght", label: "Weight", min: 300, max: 1000, step: 1, def: 500 },
      { tag: "CASL", label: "Casual", min: 0, max: 1, step: 0.01, def: 0.35 },
      { tag: "MONO", label: "Mono", min: 0, max: 1, step: 0.01, def: 0 },
      { tag: "slnt", label: "Slant", min: -15, max: 0, step: 1, def: 0 },
    ],
    rest: '"wght" 300, "CASL" 0, "MONO" 0, "slnt" 0',
    peak: '"wght" 900, "CASL" 1, "MONO" 1, "slnt" -15',
    price: 90,
  },
];

const SAMPLES = [
  "Type that moves",
  "Hamburgefonstiv",
  "Sphinx of black quartz, judge my vow",
  "0123456789 €£$ & @ %",
];

const GLYPHS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@#%€£$§¶?!.,;:()[]{}*+=/<>–—…“”");

const glyphName = (ch: string) =>
  /[A-Z]/.test(ch)
    ? `Latin capital letter ${ch}`
    : /[a-z]/.test(ch)
      ? `Latin small letter ${ch}`
      : /[0-9]/.test(ch)
        ? `Digit ${ch}`
        : "Punctuation & symbol";
const uni = (ch: string) => "U+" + (ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0");

const LICENCES = [
  {
    id: "desktop",
    label: "Desktop",
    unit: "Installed on",
    tiers: [
      { label: "1–5 users", m: 1 },
      { label: "6–20 users", m: 1.8 },
      { label: "21–50 users", m: 3 },
    ],
  },
  {
    id: "web",
    label: "Web",
    unit: "Traffic",
    tiers: [
      { label: "≤ 100k views / mo", m: 0.8 },
      { label: "≤ 1M views / mo", m: 1.4 },
      { label: "≤ 10M views / mo", m: 2.4 },
    ],
  },
  {
    id: "app",
    label: "App",
    unit: "Embedded in",
    tiers: [
      { label: "1 app", m: 2 },
      { label: "Up to 5 apps", m: 3.5 },
      { label: "Unlimited", m: 6 },
    ],
  },
];

const fmtAxis = (v: number, a: Axis) => (a.step < 1 ? v.toFixed(2) : String(Math.round(v)));

/* ================================================================== */
/*  KineticWord — fits the full width; every letter answers the cursor  */
/* ================================================================== */
function KineticWord({ word, className = "" }: { word: string; className?: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const row = useRef<HTMLDivElement | null>(null);
  const letters = useRef<Array<HTMLSpanElement | null>>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const ks = word.split("").map(() => 0);
    const mouse = { x: 0, on: false };
    let scale = 1;
    let raf = 0;
    const t0 = performance.now();

    const move = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.on = true;
    };
    const leave = () => {
      mouse.on = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const t = (now - t0) / 1000;
      const els = letters.current;
      const centers = els.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
      const vw = window.innerWidth;

      els.forEach((el, i) => {
        if (!el) return;
        let target = reduce ? 0.42 : 0.16 + 0.42 * (0.5 + 0.5 * Math.sin(t * 1.25 - i * 0.9));
        if (mouse.on && !reduce) {
          const prox = Math.max(0, 1 - Math.abs(mouse.x - centers[i]) / (vw * 0.27));
          target = Math.max(target, Math.pow(prox, 1.35));
        }
        ks[i] += (target - ks[i]) * 0.12;
        el.style.fontVariationSettings = `"wght" ${Math.round(180 + ks[i] * 720)}, "wdth" ${Math.round(72 + ks[i] * 78)}`;
      });

      const w = wrap.current;
      const r = row.current;
      if (w && r) {
        const natural = r.offsetWidth;
        const goal = natural > 0 ? w.clientWidth / natural : 1;
        scale += (goal - scale) * 0.22;
        r.style.transform = `scale(${scale.toFixed(4)})`;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [word, reduce]);

  return (
    <div ref={wrap} className={`relative w-full ${className}`} aria-label={word} role="img">
      <div
        ref={row}
        aria-hidden="true"
        className="absolute bottom-0 left-0 flex origin-bottom-left whitespace-nowrap font-anybody uppercase"
        style={{ fontSize: "22vw", lineHeight: 0.8 }}
      >
        {word.split("").map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              letters.current[i] = el;
            }}
            className="inline-block"
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Counter — animated euro figure                                     */
/* ================================================================== */
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const mv = useMotionValue(value);
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.7, ease: EASE });
    return () => c.stop();
  }, [value, mv]);
  useEffect(
    () =>
      mv.on("change", (v) => {
        if (ref.current) ref.current.textContent = "€" + Math.round(v).toLocaleString("en-US");
      }),
    [mv],
  );
  return (
    <span ref={ref} className="num">
      €{value.toLocaleString("en-US")}
    </span>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */
export default function Folio() {
  /* ---- tester ---- */
  const [famId, setFamId] = useState<Family["id"]>("tarn");
  const [vals, setVals] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(FAMILIES.map((f) => [f.id, Object.fromEntries(f.axes.map((a) => [a.tag, a.def]))])),
  );
  const [size, setSize] = useState(128);
  const [track, setTrack] = useState(0);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);

  const fam = FAMILIES.find((f) => f.id === famId) as Family;
  const settings = fam.axes.map((a) => `"${a.tag}" ${fmtAxis(vals[famId][a.tag], a)}`).join(", ");
  const textStyle = {
    fontFamily: `${fam.font}, sans-serif`,
    fontVariationSettings: settings,
  } as const;

  useEffect(() => {
    if (textRef.current && !textRef.current.textContent) textRef.current.textContent = SAMPLES[0];
  }, []);

  const setAxis = (tag: string, v: number) =>
    setVals((s) => ({ ...s, [famId]: { ...s[famId], [tag]: v } }));

  const reset = () => {
    setVals((s) => ({ ...s, [famId]: Object.fromEntries(fam.axes.map((a) => [a.tag, a.def])) }));
    setSize(128);
    setTrack(0);
  };

  const copyCss = () => {
    const css = `font-family: ${fam.font};\nfont-variation-settings: ${settings};`;
    navigator.clipboard?.writeText(css).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const tryFamily = (id: Family["id"]) => {
    setFamId(id);
    document.getElementById("tester")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---- poster hover ---- */
  const [hoverPoster, setHoverPoster] = useState<string | null>(null);

  /* ---- glyphs ---- */
  const [glyph, setGlyph] = useState("A");

  /* ---- licence ---- */
  const [picked, setPicked] = useState<Record<string, boolean>>({ tarn: true, bruit: true, casa: false });
  const [licId, setLicId] = useState("web");
  const [tierIdx, setTierIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [quoteErr, setQuoteErr] = useState("");
  const [quoted, setQuoted] = useState(false);

  const lic = LICENCES.find((l) => l.id === licId) ?? LICENCES[0];
  const tier = lic.tiers[tierIdx];
  const chosen = FAMILIES.filter((f) => picked[f.id]);
  const subtotal = chosen.reduce((s, f) => s + f.price * tier.m, 0);
  const discount = chosen.length === 3 ? 0.2 : chosen.length === 2 ? 0.1 : 0;
  const total = Math.round(subtotal * (1 - discount));

  const sendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (chosen.length === 0) return setQuoteErr("Pick at least one family.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setQuoteErr("A working email, please.");
    setQuoteErr("");
    setQuoted(true);
  };

  return (
    <div className="min-h-screen bg-foil font-bricolage text-lamp selection:bg-lamp selection:text-tomato">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-tomato px-5 pb-8 pt-6 sm:px-8 lg:px-12">
        <header className="flex items-start justify-between gap-6">
          <a href="#top" className="font-anybody text-[1.6rem] font-black leading-none tracking-tight">
            Folio<sup className="ml-0.5 align-super text-[0.45em]">®</sup>
          </a>
          <nav className="hidden items-center gap-9 md:flex">
            {[
              ["#tester", "Tester"],
              ["#families", "Families"],
              ["#glyphs", "Glyphs"],
              ["#licence", "Licence"],
            ].map(([h, l]) => (
              <a
                key={h}
                href={h}
                data-cursor="grow"
                className="group relative py-1 text-[15px] font-medium"
              >
                {l}
                <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-lamp transition-transform duration-500 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <span className="mono-label hidden text-lamp/75 sm:block">Type foundry — Amsterdam</span>
        </header>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          className="mt-14 max-w-[24ch] text-[clamp(1.6rem,3.2vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]"
        >
          Variable typefaces you can feel move. Try your cursor.
        </motion.p>

        <div className="mt-10">
          <div className="h-[26vw]">
            <KineticWord word="FOLIO" className="h-full" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t-2 border-lamp pt-4 sm:grid-cols-4">
            {[
              ["03", "Variable families"],
              ["09", "Axes to play with"],
              ["2014", "Founded in Amsterdam"],
              ["€90", "Licences from"],
            ].map(([k, v]) => (
              <div key={v} className="flex items-baseline gap-3">
                <span className="num font-anybody text-[1.5rem] font-bold leading-none">{k}</span>
                <span className="text-[13px] font-medium leading-tight text-lamp/80">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="overflow-hidden bg-lamp py-3 text-foil">
        <Marquee duration={30}>
          {["Tarn", "Bruit", "Casa", "Variable", "Open axes"].map((w, i) => (
            <span key={w} className="flex items-center">
              <span
                className="vf-breathe px-8 font-anybody text-[clamp(2rem,5.5vw,4.6rem)] uppercase leading-none"
                style={{ animationDelay: `${i * -0.8}s` }}
              >
                {w}
              </span>
              <span className="text-[1.6rem] text-tomato">✺</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ================= TYPE TESTER ================= */}
      <section id="tester" className="border-b-2 border-lamp px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="mono-label text-tomato">(01) Type tester</span>
              <MaskLines
                className="mt-4 block font-anybody font-extrabold uppercase leading-[0.9] tracking-[-0.03em]"
                lines={[
                  <span key="a" style={{ fontSize: "clamp(2.6rem,7vw,6.4rem)", fontVariationSettings: '"wdth" 85' }}>
                    Break it. Bend it.
                  </span>,
                ]}
              />
            </div>
            <p className="max-w-[36ch] text-[15px] leading-[1.6] text-lamp/70">
              Click into the text and type. Every slider is a real axis of the font, not a filter.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[340px_1fr]">
            {/* controls */}
            <aside className="space-y-8 border-2 border-lamp bg-foil2 p-5">
              <div>
                <span className="mono-label text-lamp/60">Family</span>
                <div className="mt-3 grid gap-2">
                  {FAMILIES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFamId(f.id)}
                      data-cursor="grow"
                      aria-pressed={f.id === famId}
                      className={`flex items-baseline justify-between border-2 px-4 py-3 text-left transition-colors ${
                        f.id === famId
                          ? "border-lamp bg-lamp text-foil"
                          : "border-lamp/25 hover:border-lamp"
                      }`}
                    >
                      <span
                        className="text-[1.5rem] leading-none"
                        style={{ fontFamily: `${f.font}, sans-serif`, fontVariationSettings: f.peak }}
                      >
                        {f.name}
                      </span>
                      <span className="mono-label text-[10px] opacity-60">{f.axes.length} axes</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-lamp/65">{fam.kind}</p>
              </div>

              <div className="space-y-5">
                {fam.axes.map((a) => (
                  <label key={a.tag} className="block">
                    <span className="flex items-baseline justify-between">
                      <span className="mono-label text-lamp/60">{a.label}</span>
                      <span className="mono-label num">
                        {a.tag} {fmtAxis(vals[famId][a.tag], a)}
                      </span>
                    </span>
                    <input
                      type="range"
                      className="rng mt-1"
                      min={a.min}
                      max={a.max}
                      step={a.step}
                      value={vals[famId][a.tag]}
                      onChange={(e) => setAxis(a.tag, Number(e.target.value))}
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="flex items-baseline justify-between">
                    <span className="mono-label text-lamp/60">Size</span>
                    <span className="mono-label num">{size} px</span>
                  </span>
                  <input
                    type="range"
                    className="rng mt-1"
                    min={40}
                    max={260}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="flex items-baseline justify-between">
                    <span className="mono-label text-lamp/60">Tracking</span>
                    <span className="mono-label num">{track.toFixed(2)} em</span>
                  </span>
                  <input
                    type="range"
                    className="rng mt-1"
                    min={-0.08}
                    max={0.3}
                    step={0.01}
                    value={track}
                    onChange={(e) => setTrack(Number(e.target.value))}
                  />
                </label>
              </div>

              <div>
                <span className="mono-label text-lamp/60">Sample</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SAMPLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-cursor="grow"
                      onClick={() => {
                        if (textRef.current) textRef.current.textContent = s;
                      }}
                      className="border-2 border-lamp/25 px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-lamp hover:bg-lamp hover:text-foil"
                    >
                      {s.length > 16 ? s.slice(0, 14) + "…" : s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  data-cursor="grow"
                  className="mono-label flex-1 border-2 border-lamp px-4 py-3 transition-colors hover:bg-lamp hover:text-foil"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={copyCss}
                  data-cursor="grow"
                  className="mono-label flex-1 bg-tomato px-4 py-3 transition-opacity hover:opacity-85"
                >
                  {copied ? "Copied ✓" : "Copy CSS"}
                </button>
              </div>
            </aside>

            {/* canvas */}
            <div className="flex min-h-[460px] flex-col justify-between border-2 border-lamp bg-foil p-6 sm:p-10">
              <div
                ref={textRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                role="textbox"
                aria-multiline="true"
                aria-label="Type tester text"
                data-cursor="hide"
                className="break-words outline-none"
                style={{
                  ...textStyle,
                  fontSize: `${size}px`,
                  letterSpacing: `${track}em`,
                  lineHeight: 1.02,
                  caretColor: "#ff4a24",
                  overflowWrap: "anywhere",
                }}
              />
              <div className="mt-10 border-t-2 border-lamp pt-4">
                <pre className="mono-label overflow-x-auto whitespace-pre-wrap normal-case tracking-normal text-lamp/70">
                  {`font-family: ${fam.font};\nfont-variation-settings: ${settings};`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAMILIES ================= */}
      <section id="families" className="bg-lamp px-5 py-24 text-foil sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="mono-label text-tomato">(02) Families</span>
              <MaskLines
                className="mt-4 block font-anybody font-extrabold uppercase leading-[0.9] tracking-[-0.03em]"
                lines={[
                  <span key="a" style={{ fontSize: "clamp(2.6rem,7vw,6.4rem)", fontVariationSettings: '"wdth" 85' }}>
                    Three, properly.
                  </span>,
                ]}
              />
            </div>
            <p className="max-w-[36ch] text-[15px] leading-[1.6] text-foil/60">
              Hover a poster to push its axes to the extremes. Then take it to the tester.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {FAMILIES.map((f, i) => {
              const hot = hoverPoster === f.id;
              const bg = i === 0 ? "bg-tomato text-lamp" : i === 1 ? "bg-foil text-lamp" : "bg-[#1f1f1f] text-foil border border-foil/25";
              return (
                <Reveal key={f.id} delay={i * 0.08}>
                  <article
                    onMouseEnter={() => setHoverPoster(f.id)}
                    onMouseLeave={() => setHoverPoster(null)}
                    className={`group flex min-h-[560px] flex-col justify-between p-6 ${bg}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="mono-label num">0{i + 1}</span>
                      <span className="mono-label">{f.kind}</span>
                    </div>

                    <p
                      className="select-none leading-[0.8]"
                      aria-hidden="true"
                      style={{
                        fontFamily: `${f.font}, sans-serif`,
                        fontVariationSettings: hot ? f.peak : f.rest,
                        transition: "font-variation-settings 900ms cubic-bezier(.16,.84,.28,1)",
                        fontSize: "clamp(8rem,17vw,15rem)",
                      }}
                    >
                      Aa
                    </p>

                    <div>
                      <h3
                        className="text-[2.2rem] leading-none"
                        style={{
                          fontFamily: `${f.font}, sans-serif`,
                          fontVariationSettings: f.peak,
                        }}
                      >
                        {f.name}
                      </h3>
                      <p className="mt-3 max-w-[32ch] text-[14px] leading-[1.55] opacity-75">{f.blurb}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {f.axes.map((a) => (
                          <span key={a.tag} className="mono-label border border-current px-2.5 py-1 text-[10px] opacity-70">
                            {a.tag} {a.min}–{a.max}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => tryFamily(f.id)}
                        data-cursor="label"
                        data-cursor-label="Test"
                        className="mono-label mt-6 flex w-full items-center justify-between border-t border-current pt-4 transition-opacity hover:opacity-60"
                      >
                        Try in the tester <span>→</span>
                      </button>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= GLYPHS ================= */}
      <section id="glyphs" className="border-b-2 border-lamp px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <span className="mono-label text-tomato">(03) Glyph inspector — set in {fam.name}</span>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="border-2 border-lamp bg-foil2 p-6 lg:sticky lg:top-8 lg:self-start">
              <div
                className="grid aspect-square place-items-center overflow-hidden bg-foil"
                style={{ ...textStyle }}
              >
                <motion.span
                  key={glyph}
                  initial={{ scale: 0.86, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="leading-none"
                  style={{ fontSize: "clamp(9rem,22vw,17rem)" }}
                >
                  {glyph}
                </motion.span>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t-2 border-lamp pt-3">
                <span className="mono-label num">{uni(glyph)}</span>
                <span className="mono-label text-lamp/60">{glyphName(glyph)}</span>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-12" role="listbox" aria-label="Glyphs">
              {GLYPHS.map((g) => {
                const on = g === glyph;
                return (
                  <button
                    key={g}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onMouseEnter={() => setGlyph(g)}
                    onFocus={() => setGlyph(g)}
                    onClick={() => setGlyph(g)}
                    className={`grid aspect-square place-items-center border-2 text-[clamp(1.2rem,2vw,1.9rem)] leading-none transition-colors ${
                      on ? "border-lamp bg-lamp text-tomato" : "border-lamp/15 hover:border-lamp"
                    }`}
                    style={{ ...textStyle, fontSize: undefined }}
                  >
                    <span style={{ fontSize: "clamp(1.2rem,2vw,1.9rem)" }}>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= IN USE ================= */}
      <section className="bg-foil2 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <span className="mono-label text-tomato">(04) In use</span>
          <div className="mt-8 grid gap-4 lg:grid-cols-12">
            {/* festival poster */}
            <Reveal className="lg:col-span-5 lg:row-span-2">
              <div className="flex h-full min-h-[560px] flex-col justify-between overflow-hidden bg-lamp p-6 text-tomato sm:p-8">
                <div className="mono-label flex justify-between text-foil/70">
                  <span>Amsterdam</span>
                  <span>14—16 Aug</span>
                </div>
                <p
                  className="font-anybody uppercase leading-[0.8]"
                  style={{ fontVariationSettings: '"wght" 900, "wdth" 50', fontSize: "clamp(5.5rem,13vw,13rem)" }}
                >
                  Night
                  <br />
                  Shift
                </p>
                <div className="font-bricolage text-foil">
                  <p className="text-[1.4rem] font-medium leading-tight tracking-[-0.02em]">
                    Three nights. Forty artists. One disused gasworks.
                  </p>
                  <p className="mono-label mt-4 text-foil/55">Westergasfabriek · Doors 20:00</p>
                </div>
              </div>
            </Reveal>

            {/* book cover */}
            <Reveal delay={0.08} className="lg:col-span-4">
              <div className="flex h-full min-h-[340px] flex-col justify-between border-2 border-lamp bg-foil p-7">
                <span className="mono-label text-lamp/60">A novel</span>
                <p
                  className="leading-[0.95] tracking-[-0.03em]"
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontVariationSettings: '"wght" 300, "opsz" 96, "wdth" 100',
                    fontSize: "clamp(2.4rem,4vw,4rem)",
                  }}
                >
                  The Slow Alphabet
                </p>
                <span className="text-[14px] font-medium">Mira Vantongeren</span>
              </div>
            </Reveal>

            {/* ui */}
            <Reveal delay={0.16} className="lg:col-span-3">
              <div className="h-full min-h-[340px] bg-lamp p-6 text-foil">
                <p
                  className="font-recursive"
                  style={{ fontVariationSettings: '"wght" 800, "CASL" 1, "MONO" 0', fontSize: "2rem", lineHeight: 1 }}
                >
                  Ship it!
                </p>
                <div
                  className="mt-6 space-y-2 text-[13px] leading-[1.5] text-foil/75"
                  style={{ fontFamily: '"Recursive", monospace', fontVariationSettings: '"wght" 420, "CASL" 0, "MONO" 1' }}
                >
                  <p>$ deploy --prod</p>
                  <p className="text-foil/45">building… 12.4s</p>
                  <p className="text-foil/45">uploading 184 files</p>
                  <p>
                    <span className="text-tomato">✓</span> live at folio.type
                  </p>
                </div>
              </div>
            </Reveal>

            {/* lockup */}
            <Reveal delay={0.24} className="lg:col-span-7 lg:col-start-6">
              <div className="flex h-full min-h-[240px] flex-col justify-between gap-6 overflow-hidden bg-tomato p-7">
                <span
                  className="font-recursive text-[15px]"
                  style={{ fontVariationSettings: '"wght" 500, "CASL" 1, "MONO" 0' }}
                >
                  wood-fired bread since 2009
                </span>
                <p
                  className="font-anybody leading-[0.85]"
                  style={{ fontVariationSettings: '"wght" 800, "wdth" 120', fontSize: "clamp(2.6rem,6vw,5.6rem)" }}
                >
                  Kiln &amp; Co.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= LICENCE ================= */}
      <section id="licence" className="border-t-2 border-lamp px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="mono-label text-tomato">(05) Licence</span>
              <MaskLines
                className="mt-4 block font-anybody font-extrabold uppercase leading-[0.9] tracking-[-0.03em]"
                lines={[
                  <span key="a" style={{ fontSize: "clamp(2.6rem,7vw,6.4rem)", fontVariationSettings: '"wdth" 85' }}>
                    Pay for what
                  </span>,
                  <span key="b" style={{ fontSize: "clamp(2.6rem,7vw,6.4rem)", fontVariationSettings: '"wdth" 85' }}>
                    you use.
                  </span>,
                ]}
              />
            </div>
            <p className="max-w-[36ch] text-[15px] leading-[1.6] text-lamp/70">
              Perpetual licences, all styles included. Two families take 10% off; all three take 20%.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-8 border-2 border-lamp p-6 sm:p-8">
              <div>
                <span className="mono-label text-lamp/60">1 · Families</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {FAMILIES.map((f) => {
                    const on = picked[f.id];
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPicked((p) => ({ ...p, [f.id]: !p[f.id] }))}
                        data-cursor="grow"
                        className={`flex items-center justify-between border-2 px-4 py-4 text-left transition-colors ${
                          on ? "border-lamp bg-lamp text-foil" : "border-lamp/25 hover:border-lamp"
                        }`}
                      >
                        <span className="text-[1.35rem] leading-none" style={{ fontFamily: `${f.font}, sans-serif`, fontVariationSettings: f.peak }}>
                          {f.name}
                        </span>
                        <span className="mono-label num">€{f.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="mono-label text-lamp/60">2 · Licence type</span>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {LICENCES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={l.id === licId}
                      onClick={() => {
                        setLicId(l.id);
                        setTierIdx(0);
                      }}
                      data-cursor="grow"
                      className={`border-2 px-4 py-3 text-[15px] font-medium transition-colors ${
                        l.id === licId ? "border-lamp bg-tomato" : "border-lamp/25 hover:border-lamp"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mono-label text-lamp/60">3 · {lic.unit}</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {lic.tiers.map((t, i) => (
                    <button
                      key={t.label}
                      type="button"
                      aria-pressed={i === tierIdx}
                      onClick={() => setTierIdx(i)}
                      data-cursor="grow"
                      className={`border-2 px-4 py-3 text-left text-[14px] font-medium transition-colors ${
                        i === tierIdx ? "border-lamp bg-lamp text-foil" : "border-lamp/25 hover:border-lamp"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-lamp p-6 text-foil sm:p-8">
              <div>
                <span className="mono-label text-foil/55">Your licence</span>
                <p className="num mt-3 font-anybody text-[clamp(3.6rem,7vw,6.4rem)] font-extrabold leading-none text-tomato" style={{ fontVariationSettings: '"wdth" 110' }}>
                  <Counter value={total} />
                </p>
                <ul className="mt-6 space-y-2 border-t border-foil/25 pt-5 text-[14px]">
                  {chosen.length === 0 && <li className="text-foil/55">No family selected.</li>}
                  {chosen.map((f) => (
                    <li key={f.id} className="flex justify-between">
                      <span>
                        {f.name} · {lic.label}
                      </span>
                      <span className="num text-foil/75">€{Math.round(f.price * tier.m)}</span>
                    </li>
                  ))}
                  {discount > 0 && (
                    <li className="flex justify-between text-tomato">
                      <span>Bundle − {Math.round(discount * 100)}%</span>
                      <span className="num">− €{Math.round(subtotal * discount)}</span>
                    </li>
                  )}
                </ul>
              </div>

              {quoted ? (
                <div className="mt-8 border-t border-foil/25 pt-5">
                  <p className="mono-label text-tomato">Quote sent</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-foil/80">
                    A PDF quote for {chosen.map((f) => f.name).join(" + ")} is on its way to {email}.
                  </p>
                  <button type="button" onClick={() => setQuoted(false)} className="mono-label mt-4 border-b border-foil/40 pb-1 hover:text-tomato">
                    Change the licence
                  </button>
                </div>
              ) : (
                <form onSubmit={sendQuote} noValidate className="mt-8 border-t border-foil/25 pt-5">
                  <label className="block">
                    <span className="mono-label text-foil/55">Email for the quote</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.com"
                      className="mt-1 w-full border-b border-foil/40 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-foil/30 focus:border-tomato"
                    />
                  </label>
                  {quoteErr && <p className="mt-2 text-[13px] text-tomato">{quoteErr}</p>}
                  <button
                    type="submit"
                    data-cursor="label"
                    data-cursor-label="Send"
                    className="mono-label mt-5 flex w-full items-center justify-between bg-tomato px-6 py-4 text-lamp transition-opacity hover:opacity-85"
                  >
                    Email me the quote <span>→</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="overflow-hidden bg-lamp px-5 pb-8 pt-16 text-foil sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 border-b border-foil/20 pb-10 sm:grid-cols-3">
            <div>
              <p className="mono-label text-foil/45">Studio</p>
              <p className="mt-3 text-[15px] leading-relaxed">Overhoeksplein 2, 1031 KS Amsterdam</p>
            </div>
            <div>
              <p className="mono-label text-foil/45">Write</p>
              <p className="mt-3 text-[15px] leading-relaxed">hello@folio.type</p>
            </div>
            <div>
              <p className="mono-label text-foil/45">Colophon</p>
              <p className="mt-3 text-[13px] leading-relaxed text-foil/60">
                Demo specimens are set in Anybody, Bricolage Grotesque and Recursive — open-licence
                variable fonts standing in for Tarn, Bruit and Casa.
              </p>
            </div>
          </div>
          <div className="mt-16 h-[26vw] text-tomato">
            <KineticWord word="FOLIO" className="h-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
