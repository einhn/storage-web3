// frontend/src/pages/app.js
import "../styles.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <header
        style={{
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 600 }}>storage-web3</div>
        <nav style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
          <a href="/">Home</a>
          <a href="/login">Login</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/upload">Upload</a>
        </nav>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem 1rem",
        }}
      >
        <Component {...pageProps} />
      </main>

      <footer
        style={{
          padding: "0.75rem 1.5rem",
          borderTop: "1px solid #eee",
          fontSize: "0.8rem",
          color: "#888",
          textAlign: "center",
        }}
      >
        &copy; {new Date().getFullYear()} storage-web3 prototype
      </footer>
    </div>
  );
}