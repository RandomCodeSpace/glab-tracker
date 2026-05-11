import type { SVGProps } from "react";

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  size?: number;
}

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
      <rect x="3" y="13" width="4" height="8" rx="1.5" />
      <rect x="10" y="7" width="4" height="14" rx="1.5" />
      <rect x="17" y="10" width="4" height="11" rx="1.5" />
    </svg>
  );
}
