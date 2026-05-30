import type { SVGProps } from "react";

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  size?: number;
}

// Monoline "lane" mark: three ascending tracks on a 24-grid, single solid
// fill (currentColor), tight 1.5 radii. No gradients. Reads crisply at ~20px.
export function Logo({ size = 22, ...rest }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <rect x="4" y="14" width="3.5" height="6" rx="1.5" />
      <rect x="10.25" y="9" width="3.5" height="11" rx="1.5" />
      <rect x="16.5" y="4" width="3.5" height="16" rx="1.5" />
    </svg>
  );
}
