import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };
export const socialImageContentType = "image/png";

export function renderEditorialSocialImage({ label, title, description }: { label: string; title: string; description: string }) {
  const safeTitle = title.trim().slice(0, 82);
  const safeDescription = description.trim().slice(0, 180);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        color: "#173c32",
        background: "#f6f0e5",
        fontFamily: "Georgia, serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", right: -120, top: -150, width: 500, height: 500, borderRadius: 999, background: "#d56f45", opacity: 0.92 }} />
      <div style={{ position: "absolute", right: -80, bottom: -230, width: 600, height: 600, borderRadius: 999, background: "#173c32" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "Arial, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
        <span style={{ display: "flex", width: 52, height: 6, background: "#d56f45" }} />
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: 850 }}>
        <div style={{ display: "flex", fontSize: safeTitle.length > 52 ? 58 : 72, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2 }}>{safeTitle}</div>
        <div style={{ display: "flex", marginTop: 26, maxWidth: 760, fontFamily: "Arial, sans-serif", fontSize: 28, lineHeight: 1.35, color: "#5e625c" }}>{safeDescription}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Arial, sans-serif", fontSize: 22, fontWeight: 700 }}>
        <span>CarteaZilei</span>
        <span style={{ color: "#f6f0e5", zIndex: 1 }}>Recomandări explicate</span>
      </div>
    </div>,
    socialImageSize,
  );
}
