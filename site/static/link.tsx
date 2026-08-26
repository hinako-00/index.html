/* 静的ビルドでは next/link を素の <a> に置き換える（vite.static.config.ts の alias） */
import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function Link(
  { href, children, ...rest }: { href: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return <a href={href} {...rest}>{children}</a>;
}
