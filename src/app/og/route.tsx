import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const colorMap: Record<string, string> = {
  green: "rgba(74,222,128,",
  amber: "rgba(251,191,36,",
  cyan: "rgba(34,211,238,",
  red: "rgba(248,113,113,",
  violet: "rgba(167,139,250,",
  emerald: "rgba(52,211,153,",
  rose: "rgba(251,113,133,",
  sky: "rgba(56,189,248,",
  teal: "rgba(45,212,191,",
  indigo: "rgba(129,140,248,",
  orange: "rgba(251,146,60,",
  pink: "rgba(244,114,182,",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = (searchParams.get("title") || "Foxfire").slice(0, 200);
  const category = (searchParams.get("category") || "").slice(0, 50);
  const color = searchParams.get("color") || "green";
  const readTime = (searchParams.get("readTime") || "").slice(0, 20);

  const c = colorMap[color] || colorMap.green;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "60px 80px",
          background:
            "linear-gradient(145deg, #0a0a0c 0%, #111118 50%, #0d0d12 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c}0.08) 0%, ${c}0.02) 40%, transparent 70%)`,
          }}
        />

        {/* Top: logo + category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                boxShadow: "0 0 16px rgba(74,222,128,0.4)",
              }}
            />
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: "rgba(228,228,231,0.6)",
              }}
            >
              Foxfire
            </div>
          </div>

          {category && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: `${c}0.8)`,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase" as const,
                  color: `${c}0.7)`,
                }}
              >
                {category}
              </div>
            </div>
          )}
        </div>

        {/* Center: title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 900,
            overflow: "hidden",
            maxHeight: 300,
          }}
        >
          <div
            style={{
              fontSize:
                title.length > 80 ? 36 : title.length > 40 ? 48 : 56,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "rgba(228,228,231,0.92)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: read time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {readTime && (
            <div style={{ fontSize: 14, color: "#71717a" }}>
              {readTime} read
            </div>
          )}
          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(to right, ${c}0.2), transparent)`,
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
