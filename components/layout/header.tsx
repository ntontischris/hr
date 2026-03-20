import { UserMenu } from "@/components/layout/user-menu";

import type { UserProfile } from "@/lib/types/user";

interface HeaderProps {
  user: UserProfile;
  children?: React.ReactNode;
}

export function Header({ user, children }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <div className="lg:hidden">{children}</div>
      <h1 className="text-sm font-semibold lg:text-base">HR AI Assistant</h1>
      <div className="ml-auto">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
