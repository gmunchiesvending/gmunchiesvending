"use client";

import { usePathname } from "next/navigation";
import { Fragment, type ReactNode } from "react";

export default function AdminAwareChrome({
  navbar,
  footer,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  // Explicit keys: React 19 may warn if multiple dynamic siblings are reconciled like a list.
  return [
    <Fragment key="site-navbar">{navbar}</Fragment>,
    <Fragment key="site-main">{children}</Fragment>,
    <Fragment key="site-footer">{footer}</Fragment>,
  ];
}

