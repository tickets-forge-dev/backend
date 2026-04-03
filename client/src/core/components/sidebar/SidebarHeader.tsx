'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Settings, BookOpen, FileText, Shield, HelpCircle } from 'lucide-react';
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
import { useUserStore } from '@/stores/user-store';
import { cn } from '@/lib/utils';
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
  const avatarEmoji = useUserStore((s) => s.profile?.avatarEmoji);
  const [imgError, setImgError] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="px-2.5 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full gap-2 py-1 h-auto ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-2'}`}
          >
            {/* Avatar: emoji > photo > initials */}
            {avatarEmoji ? (
              <div className="h-6 w-6 min-w-6 min-h-6 rounded-full bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                <span className="text-sm leading-none">{avatarEmoji}</span>
              </div>
            ) : user.photoURL && !imgError ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-6 w-6 min-w-6 min-h-6 rounded-full flex-shrink-0 object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-6 w-6 min-w-6 min-h-6 rounded-full bg-[var(--bg-hover)] text-[var(--text-tertiary)] flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                {getInitials(user.displayName)}
              </div>
            )}
            {/* Name only — email in dropdown */}
            <span className={cn(
              'text-[13px] font-medium text-[var(--text-secondary)] truncate whitespace-nowrap transition-[opacity,transform] duration-200',
              sidebarCollapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
            )}>
              {user.displayName || 'User'}
            </span>
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
          <DropdownMenuItem
            onClick={() => router.push('/docs')}
            className="cursor-pointer"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Docs
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
