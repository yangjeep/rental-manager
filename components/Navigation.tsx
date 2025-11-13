'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Listings" },
  { href: "/map", label: "Map" },
  { href: "/apply", label: "Submit an Application" },
  { href: "/about", label: "About" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 items-center">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border-1.5 border-transparent transition-colors ${
              isActive
                ? 'text-accent bg-accent/15 border-accent/30 font-semibold'
                : 'text-muted hover:text-fg hover:bg-white/10 hover:border-white/15'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

