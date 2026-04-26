import { ChevronDown } from "lucide-react";

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Wait — how long does this QR actually work?",
    a: (
      <>
        <strong>Forever</strong>, with one condition: as long as the destination
        URL you encoded stays live. The QR doesn{"'"}t route through our
        servers — the URL is physically baked into the pixels. Even if this
        site disappears tomorrow, every QR you{"'"}ve already downloaded keeps
        working.
      </>
    ),
  },
  {
    q: "How do I track who scans it?",
    a: (
      <>
        Add UTM parameters to your URL before generating the QR. For a flyer,
        encode something like{" "}
        <code className="text-xs bg-[var(--color-surface-soft)] px-1.5 py-0.5 rounded">
          porchlightstudios.com/book?utm_source=qr&amp;utm_campaign=flyer-spring
        </code>
        . Your site analytics (Google Analytics via Wix, Plausible, Fathom, etc.)
        will split traffic by campaign so you can see exactly which flyer is
        working.
        <br />
        <br />
        You don{"'"}t get raw scan counts (no scan without a site visit), but
        you get what actually matters: conversions you can tie to a specific
        print run.
      </>
    ),
  },
  {
    q: "What if I need to change where it goes after I've printed it?",
    a: (
      <>
        You can{"'"}t change what a printed QR encodes — it{"'"}s ink on paper.
        But you can make the encoded URL itself a redirect you control.
        <br />
        <br />
        <strong>The pro move:</strong> instead of encoding{" "}
        <code className="text-xs bg-[var(--color-surface-soft)] px-1.5 py-0.5 rounded">
          eventbrite.com/event-xyz
        </code>
        , encode{" "}
        <code className="text-xs bg-[var(--color-surface-soft)] px-1.5 py-0.5 rounded">
          porchlightstudios.com/open-house
        </code>
        . If the event changes, you update the redirect on your own site and
        every printed QR keeps pointing to the right place. You own the domain
        forever, so the link is forever.
      </>
    ),
  },
  {
    q: "What if I want to try a different design later?",
    a: (
      <>
        Easy — just come back, pick a new style, download a new QR. The{" "}
        {'"Your recent QRs"'} panel remembers what you{"'"}ve made so you can
        click back to any previous config.
        <br />
        <br />
        Just remember: once you{"'"}ve printed something, the design on that
        printed piece is locked. Swap designs before sending to the printer,
        not after.
      </>
    ),
  },
  {
    q: "Is it really free? What's the catch?",
    a: (
      <>
        No catch. The generator runs entirely in your browser — we don{"'"}t
        pay per-QR compute costs, so there{"'"}s nothing to charge you for. No
        ads, no account, no email capture, no tracking.
        <br />
        <br />
        Built by one person as a side project. Source is on{" "}
        <a
          href="https://github.com/texastentialism/qr-forever"
          className="underline hover:text-[var(--color-espresso)]"
        >
          GitHub
        </a>{" "}
        if you want to verify nothing shady is happening.
      </>
    ),
  },
  {
    q: "My QR doesn't scan — what went wrong?",
    a: (
      <>
        Most common causes:
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Printed too small.</strong> Stay above 2cm × 2cm on physical
            materials. Bigger is always safer.
          </li>
          <li>
            <strong>No quiet zone.</strong> Need at least 4mm of blank space
            around the QR — the white border is part of what makes it scannable.
          </li>
          <li>
            <strong>Low contrast.</strong> Dark dots on light background scan
            most reliably. If you{"'"}re using a colored style, scan-test before
            you commit.
          </li>
          <li>
            <strong>Logo too big.</strong> If you added a center logo, raise
            error correction to H and keep the logo under 30% of the QR area.
          </li>
        </ul>
      </>
    ),
  },
];

export default function Faq() {
  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-5 text-[var(--color-ink)]">
        Good questions people ask
      </h2>
      <div className="space-y-2">
        {ITEMS.map((item, i) => (
          <details
            key={i}
            className="group bg-[var(--color-surface)] rounded-xl border border-[var(--color-line)] shadow-sm overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-soft)] transition-colors">
              <span className="text-sm md:text-base font-medium text-[var(--color-ink)]">
                {item.q}
              </span>
              <ChevronDown className="size-5 text-[var(--color-ink-faint)] transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <div className="px-5 pb-5 pt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed border-t border-[var(--color-line)]">
              <div className="pt-4">{item.a}</div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
