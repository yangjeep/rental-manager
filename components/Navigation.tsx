import { NavLink } from "@remix-run/react";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Listings" },
  { href: "/map", label: "Map" },
  { href: "/apply", label: "Submit an Application" },
  { href: "/about", label: "About" },
];

export function Navigation() {
  return (
    <nav className="flex gap-2 items-center">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/"}
          className={({ isActive }) =>
            `px-5 py-2.5 rounded-full text-sm font-medium border-1.5 border-transparent transition-colors ${
              isActive
                ? 'text-accent bg-accent/15 border-accent/30 font-semibold'
                : 'text-muted hover:text-fg hover:bg-white/10 hover:border-white/15'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
