'use client';

import { ThemeToggle } from '@/core/components/ThemeToggle';
import { AuthCheck } from '@/lib/auth-check';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthCheck>
  );
}

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Get user initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Minimal header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[var(--content-max)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-[var(--text-lg)] font-medium text-[var(--text)]">
                Forge
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="h-9 w-9 rounded-full"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[var(--purple)] text-white flex items-center justify-center text-[var(--text-xs)] font-medium">
                          {getInitials(user.displayName)}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-[var(--text-sm)] font-medium">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - centered max-width, no sidebar */}
      <main className="mx-auto max-w-[var(--content-max)] px-6 py-12">
        {children}
      </main>
    </div>
  );
}

