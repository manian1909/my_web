// Small static SVG scenes, drawn in the accent colour via currentColor.

export function Medal() {
  return (
    <svg className="medal" viewBox="0 0 220 260" role="img" aria-label="Gold medal">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="0.35" stopColor="#f5c542" />
          <stop offset="0.7" stopColor="#d89a12" />
          <stop offset="1" stopColor="#f7d774" />
        </linearGradient>
        <clipPath id="medal-clip">
          <circle cx="110" cy="150" r="70" />
        </clipPath>
      </defs>
      {/* ribbon */}
      <path d="M62 8h40l26 90-32 8z" fill="#3a404b" />
      <path d="M158 8h-40l-26 90 32 8z" fill="#2b3039" />
      <path d="M102 8h16v98h-16z" fill="#f4f4f0" opacity="0.9" />
      {/* medal */}
      <circle cx="110" cy="150" r="76" fill="url(#gold)" />
      <circle cx="110" cy="150" r="64" fill="none" stroke="#b9770e" strokeWidth="2" strokeDasharray="2 5" opacity="0.7" />
      <circle cx="110" cy="150" r="52" fill="#f6cf55" stroke="#c48a10" strokeWidth="2" />
      <path
        d="M110 118l9.4 19.2 21.2 3-15.3 15 3.6 21.1L110 166l-18.9 10.3 3.6-21.1-15.3-15 21.2-3z"
        fill="#fff6c9"
        stroke="#b9770e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="110"
        y="205"
        textAnchor="middle"
        fontFamily="Geist Mono Variable, monospace"
        fontSize="13"
        fontWeight="600"
        fill="#8a5a06"
        letterSpacing="2"
      >
        NCSC
      </text>
      <g clipPath="url(#medal-clip)">
        <rect className="medal-shine" x="-40" y="70" width="34" height="170" fill="#fff" opacity="0.5" transform="rotate(20 0 150)" />
      </g>
    </svg>
  )
}
