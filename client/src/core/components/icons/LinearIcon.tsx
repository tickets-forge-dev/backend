/**
 * Official Linear Icon
 * Based on Linear's official branding - clean minimalist design
 */
export function LinearIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Linear's signature design - arrow/chevron pattern */}
      <rect width="128" height="128" rx="24" fill="#000000" />
      <g>
        {/* Top-left arrow */}
        <path
          d="M32 48L56 64L32 80"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Bottom-right arrow */}
        <path
          d="M72 48L96 64L72 80"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
