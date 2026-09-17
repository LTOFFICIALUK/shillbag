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
          background: "#f3ead6",
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64">
          <path
            d="M21 23.5h22L41 45.2q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0L21 23.5Z"
            fill="none"
            stroke="#12110e"
            strokeWidth="2.15"
            strokeLinejoin="round"
          />
          <path
            d="M27.2 23.5c0-5.6 9.6-5.6 9.6 0"
            fill="none"
            stroke="#12110e"
            strokeWidth="2.15"
            strokeLinecap="round"
          />
          <circle
            cx="46.2"
            cy="46.4"
            r="10.4"
            fill="#f3ead6"
            stroke="#157a4a"
            strokeWidth="2.05"
          />
          <path
            d="m42 46.6 3.05 3.1 6.35-7.15"
            fill="none"
            stroke="#157a4a"
            strokeWidth="2.05"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
