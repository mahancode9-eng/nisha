/**
 * Static page backdrop — no cursor tracking, no animated blobs.
 * Keeps the landing scroll smooth on mid-range devices.
 */
export function LandingAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden"
    >
      <div className="absolute inset-0 bg-[#09090b]" />

      <div className="absolute left-1/2 top-[-12%] h-[48vh] w-[85vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.22)_0%,transparent_68%)]" />
      <div className="absolute bottom-[-18%] left-[-8%] h-[40vh] w-[50vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.1)_0%,transparent_70%)]" />
      <div className="absolute bottom-[8%] right-[-12%] h-[36vh] w-[42vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]" />

      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse at center, black 18%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 18%, transparent 72%)",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,11,0.5)_100%)]" />
    </div>
  );
}
