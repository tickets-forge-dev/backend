'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Settings, BookOpen, FileText, Shield } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useState } from 'react';

// Get user initials for avatar
const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function SidebarHeader() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { sidebarCollapsed, resetOnboarding } = useUIStore();
  const [imgError, setImgError] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="border-b border-[var(--border)] p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full gap-3 py-2 h-auto ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-2'}`}
          >
            {/* Avatar - always visible */}
            {user.photoURL && !imgError ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-8 w-8 min-w-8 min-h-8 rounded-full flex-shrink-0 object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-8 w-8 min-w-8 min-h-8 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-[var(--text-xs)] font-medium flex-shrink-0">
                {getInitials(user.displayName)}
              </div>
            )}
            {/* Name and email - hidden when collapsed */}
            {!sidebarCollapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <p className="text-[var(--text-sm)] font-semibold text-[var(--text)] truncate w-full">
                  {user.displayName || 'User'}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate w-full">
                  {user.email}
                </p>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="right"
          alignOffset={-4}
          sideOffset={12}
          className="w-56 z-[var(--z-modal)]"
        >
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-0.5">
              <p className="text-[var(--text-sm)] font-semibold text-[var(--text)]">
                {user.displayName || 'User'}
              </p>
              <p className="text-[11px] font-normal text-[var(--text-tertiary)]">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push('/settings')}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={resetOnboarding}
            className="cursor-pointer"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Show Onboarding
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.open('/terms', '_blank')}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            Terms of Service
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open('/privacy', '_blank')}
            className="cursor-pointer"
          >
            <Shield className="mr-2 h-4 w-4" />
            Privacy Policy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
