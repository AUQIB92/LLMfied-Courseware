+"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { Menu } from "lucide-react";
import clsx from "clsx";

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { href: "/profile/settings", label: "Settings" },
  { href: "/profile/notifications", label: "Notifications" },
  { href: "/profile/preferences", label: "Preferences" },
];

export default function ProfileShell({ children }: Props) {
  const { profile } = useProfile();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href} className={clsx(
      "block px-4 py-2 rounded-lg text-sm font-medium transition-all", 
      pathname === href
        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    )} onClick={() => setOpen(false)}>
      {label}
    </Link>
  );

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-200 dark:border-slate-700">
        <Avatar className="h-12 w-12">
          {profile?.avatar && <AvatarImage src={profile.avatar} alt={profile.name ?? "Avatar"} />}
          <AvatarFallback>
            {profile?.name?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {profile?.name ?? "User"}
          </p>
          {profile?.role && (
            <Badge variant="secondary" className="mt-1">
              {profile.role}
            </Badge>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/60 dark:from-slate-900 dark:via-slate-900/40 dark:to-slate-800">
      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden absolute top-4 left-4 z-50">
          <Button size="icon" variant="outline">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-slate-900">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      <div className="grid md:grid-cols-[240px_1fr] gap-0 max-w-7xl mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden md:block sticky top-0 h-screen border-r border-slate-200 dark:border-slate-700 bg-white/80 backdrop-blur dark:bg-slate-900/60">
          <div className="h-full w-60">{SidebarContent}</div>
        </aside>

        {/* Main content */}
        <main className="px-4 sm:px-6 lg:px-10 py-10 w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 