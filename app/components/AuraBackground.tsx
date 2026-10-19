/* Living aura background: slow-drifting blurred color blobs behind content.
   Render once near the top of a page; it sits fixed behind everything. */

export default function AuraBackground() {
  return (
    <div
      aria-hidden="true"
      className="aura-layer pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="aura-blob aura-a left-[-10%] top-[-12%] h-[46vmax] w-[46vmax]"
        style={{ background: "radial-gradient(circle, rgb(34 211 238 / 0.16), transparent 65%)" }}
      />
      <div
        className="aura-blob aura-b right-[-12%] top-[30%] h-[40vmax] w-[40vmax]"
        style={{ background: "radial-gradient(circle, rgb(129 140 248 / 0.14), transparent 65%)" }}
      />
      <div
        className="aura-blob aura-a bottom-[-14%] left-[22%] h-[36vmax] w-[36vmax]"
        style={{ background: "radial-gradient(circle, rgb(34 211 238 / 0.10), transparent 65%)" }}
      />
    </div>
  );
}
