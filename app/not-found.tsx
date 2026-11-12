import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#111426", color: "#f4eaff", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 64, fontWeight: 900, color: "#d5a8ff", margin: "0 0 12px" }}>404</h1>
        <h2 style={{ fontSize: 24, margin: "0 0 16px" }}>Página não encontrada</h2>
        <p style={{ color: "#b8b4c8", marginBottom: 24 }}>A tutora procurou por todo o campus, mas este caminho não existe!</p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "linear-gradient(110deg,#9166dc,#c27ac2)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 800,
            textDecoration: "none"
          }}
        >
          Voltar ao Início
        </Link>
      </div>
    </main>
  );
}
