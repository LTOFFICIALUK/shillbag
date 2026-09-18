import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          background: "#111111",
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64">
          <path
            d="M21 24h22l-2 20.2q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0L21 24Z"
            fill="none"
            stroke="#d4fc50"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M27.2 24c0-5.4 9.6-5.4 9.6 0"
            fill="none"
            stroke="#d4fc50"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
