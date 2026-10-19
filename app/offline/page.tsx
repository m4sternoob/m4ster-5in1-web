export const metadata = {
  title: "Offline — M4ster-5IN1",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#0a0a1a",
        color: "#e9d5ff",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 56 }}>🎮</div>
      <h1 style={{ fontSize: 28, margin: 0 }}>You&apos;re offline</h1>
      <p style={{ opacity: 0.7, maxWidth: 340, margin: 0 }}>
        M4ster-5IN1 needs a connection for this page. Pages you&apos;ve already visited
        still work offline.
      </p>
      <a
        href="/"
        style={{
          padding: "12px 28px",
          borderRadius: 999,
          background: "#22d3ee",
          color: "#0a0a1a",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Back to M4ster-5IN1
      </a>
    </main>
  );
}
