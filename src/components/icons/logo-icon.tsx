
import type { SVGProps } from 'react';

interface LogoIconProps extends SVGProps<SVGSVGElement> {
  showText?: boolean;
}

export function LogoIcon({ showText = true, ...props }: LogoIconProps) {
  const viewBoxWidth = showText ? 130 : 24; // Dynamically adjust viewBox width

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxWidth} 24`} // Use dynamic viewBox width
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5" // Adjusted stroke width for better visual balance with text
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props} // Spread props to allow className, style, etc.
    >
      {/* Terminal Symbol (slightly adjusted for visual consistency) */}
      <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M7 9h4" /> {/* Adjusted y position of lines for better spacing */}
      <path d="M7 13h8" />

      {showText && (
        <text
          x="28" // Positioned after the terminal icon
          y="16.5" // Fine-tuned vertical centering for 10px font size in 24px height
          fontFamily="var(--font-geist-mono), Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" // Use CSS variable and fallbacks
          fontSize="10" // Font size in SVG units
          fill="currentColor" // Use current color for text fill
          stroke="none" // No stroke for text
          fontWeight="500" // Medium weight for better readability
        >
          console.text
        </text>
      )}
    </svg>
  );
}
