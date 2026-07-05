import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "نیشا | فروشگاه‌ساز مدرن برای فروشندگان";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          direction: "rtl",
          background:
            "radial-gradient(circle at top left, rgba(124,58,237,0.42), transparent 30%), radial-gradient(circle at bottom right, rgba(236,72,153,0.18), transparent 28%), linear-gradient(135deg, #080713 0%, #111127 50%, #1a0a2e 100%)",
          color: "#f8f5ff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 28%), linear-gradient(90deg, rgba(255,255,255,0.02), transparent 34%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: -90,
            top: -40,
            width: 280,
            height: 280,
            borderRadius: 9999,
            background: "rgba(124,58,237,0.22)",
            filter: "blur(36px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -100,
            bottom: -60,
            width: 320,
            height: 320,
            borderRadius: 9999,
            background: "rgba(236,72,153,0.18)",
            filter: "blur(44px)",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            padding: 72,
            gap: 48,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560, height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  padding: "10px 18px",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    background: "#8b5cf6",
                    boxShadow: "0 0 0 8px rgba(139,92,246,0.16)",
                  }}
                />
                ویژه فروشندگان
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 66, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-0.04em" }}>
                  فروشگاه خود را بسازید
                </div>
                <div style={{ fontSize: 36, lineHeight: 1.3, color: "rgba(255,255,255,0.76)" }}>
                  و سریع‌تر به فروش برسید
                </div>
                <div style={{ fontSize: 26, lineHeight: 1.45, color: "rgba(255,255,255,0.58)", maxWidth: 520 }}>
                  فروشگاه، محصول، سفارش و گفتگو در یک تجربه ساده، مدرن و سریع.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {["فروشگاه اختصاصی", "مدیریت سفارش", "گفتگو با مشتری", "اعتماد و آمار"].map((label) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 9999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    padding: "10px 16px",
                    fontSize: 18,
                    color: "rgba(255,255,255,0.78)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 420,
              borderRadius: 36,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(15,23,42,0.82)",
              boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
              padding: 18,
            }}
          >
            <div
              style={{
                borderRadius: 28,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 18,
                      background: "rgba(124,58,237,0.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#c4b5fd",
                    }}
                  >
                    ن
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 13, letterSpacing: "0.24em", color: "rgba(255,255,255,0.52)" }}>
                      PREVIEW
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>فروشگاه نیشا</div>
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 9999,
                    border: "1px solid rgba(139,92,246,0.28)",
                    background: "rgba(139,92,246,0.12)",
                    padding: "8px 14px",
                    fontSize: 16,
                    color: "#c4b5fd",
                  }}
                >
                  ۸۵٪ آماده
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                {[
                  ["۲۴", "سفارش امروز"],
                  ["۴.۹", "امتیاز"],
                  ["۳", "پیام جدید"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 22,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
                    <div style={{ marginTop: 6, fontSize: 14, color: "rgba(255,255,255,0.58)" }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 24,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "linear-gradient(180deg, rgba(124,58,237,0.18), rgba(255,255,255,0.04))",
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.58)" }}>اولین محصول</div>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>کیف مینیمال چرمی</div>
                  <div style={{ marginTop: 12, fontSize: 17, color: "rgba(255,255,255,0.62)" }}>۲,۴۸۰,۰۰۰ تومان</div>
                </div>
                <div
                  style={{
                    width: 108,
                    borderRadius: 24,
                    background: "linear-gradient(135deg, rgba(124,58,237,0.92), rgba(236,72,153,0.52))",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                    padding: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.28em",
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  NEW
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)",
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.58)" }}>اعتماد</div>
                  <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>نشان فعال</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)",
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.58)" }}>گفتگو</div>
                  <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>فعال</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>),
    {
      ...size,
    },
  );
}
