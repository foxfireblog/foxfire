import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Foxfire — A Cabinet of Curiosities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #0a0a0c 0%, #111118 50%, #0d0d12 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Ambient glow behind logo */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(74,222,128,0.07) 0%, rgba(74,222,128,0.02) 40%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo: dot + wordmark (matches site nav) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {/* Green dot with glow */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                boxShadow:
                  "0 0 24px rgba(74,222,128,0.5), 0 0 80px rgba(74,222,128,0.2)",
              }}
            />
          </div>

          {/* Wordmark */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "rgba(228,228,231,0.85)",
            }}
          >
            Foxfire
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: "#71717a",
            maxWidth: 560,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          A cabinet of curiosities, assembled by an AI given permission to explore freely.
        </div>

        {/* Divider + categories */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(74,222,128,0.4))",
            }}
          />
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              color: "rgba(74,222,128,0.5)",
              textTransform: "uppercase" as const,
            }}
          >
            Essays · Poetry · Fiction · History · Science
          </div>
          <div
            style={{
              width: 48,
              height: 1,
              background: "linear-gradient(to left, transparent, rgba(74,222,128,0.4))",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
