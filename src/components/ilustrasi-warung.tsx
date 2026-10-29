export function IlustrasiWarung() {
  return (
    <svg
      className="ilus"
      viewBox="0 0 400 300"
      role="img"
      aria-label="Ilustrasi warung dengan beras, minyak, telur, dan sayur, plus gelembung chat"
    >
      <circle cx="205" cy="140" r="118" fill="#d8f1ec" />
      <circle cx="322" cy="62" r="20" fill="#f5edd4" />
      <rect x="52" y="238" width="300" height="6" rx="3" fill="#dde4df" />

      <g>
        <rect x="92" y="118" width="10" height="122" rx="4" fill="#0a5b54" />
        <rect x="298" y="118" width="10" height="122" rx="4" fill="#0a5b54" />
        <path d="M78 122 L200 84 L322 122 Z" fill="#0f766e" />
        <path d="M78 122 h244" stroke="#0a5b54" strokeWidth="5" strokeLinecap="round" />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={94 + i * 30} cy="126" r="9" fill={i % 2 ? "#ffffff" : "#0e8c82"} />
        ))}
      </g>

      <rect x="104" y="196" width="192" height="14" rx="6" fill="#0a5b54" />
      <rect x="112" y="210" width="10" height="30" rx="4" fill="#0a5b54" />
      <rect x="278" y="210" width="10" height="30" rx="4" fill="#0a5b54" />

      <g>
        <path d="M128 196 v-34 a10 10 0 0 1 20 0 v34 Z" fill="#f3e5cf" />
        <rect x="126" y="188" width="24" height="8" rx="4" fill="#d9b77c" />
        <rect x="132" y="146" width="12" height="10" rx="4" fill="#c04237" />
      </g>

      <g>
        <rect x="168" y="160" width="18" height="36" rx="6" fill="#e9b949" />
        <rect x="173" y="150" width="8" height="12" rx="3" fill="#a16207" />
      </g>

      <g>
        <rect x="204" y="180" width="46" height="16" rx="6" fill="#d9c8a9" />
        {[212, 226, 240].map((x) => (
          <circle key={x} cx={x} cy="176" r="7" fill="#f6f0e2" stroke="#d9c8a9" strokeWidth="2" />
        ))}
      </g>

      <g>
        <path d="M266 196 c-8-14 2-26 12-24 c2 8-2 18-12 24 Z" fill="#1f8a54" />
        <path d="M278 196 c0-16 12-22 20-18 c0 10-8 20-20 18 Z" fill="#35a06a" />
      </g>

      <g className="ilus-goyang">
        <rect x="238" y="128" width="4" height="12" fill="#0a5b54" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={228 + i * 14} y="140" width="11" height="16" rx="3" fill={i === 1 ? "#c04237" : "#e9b949"} />
        ))}
      </g>

      <g className="ilus-apung">
        <path d="M286 44 h84 a14 14 0 0 1 14 14 v26 a14 14 0 0 1-14 14 h-52 l-16 14 v-14 h-16 a14 14 0 0 1-14-14 V58 a14 14 0 0 1 14-14 Z" fill="#ffffff" stroke="#dde4df" strokeWidth="2" />
        <circle className="ilus-titik" cx="312" cy="71" r="5" fill="#0f766e" />
        <circle className="ilus-titik" cx="330" cy="71" r="5" fill="#0f766e" />
        <circle className="ilus-titik" cx="348" cy="71" r="5" fill="#0f766e" />
      </g>
    </svg>
  );
}
