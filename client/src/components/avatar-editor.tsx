'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Smile, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmojiPickerDialog } from './emoji-picker-dialog';
import { UserApiService } from '@/src/api/user-api';
import { resizeImage } from '@/src/utils/image-resize';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user-store';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const userApi = new UserApiService();

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export function AvatarEditor() {
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarEmoji = profile?.avatarEmoji;
  const photoURL = profile?.photoURL || user?.photoURL;
  const displayName = user?.displayName;

  const syncToSidebar = useCallback(async (newPhotoURL?: string, newEmoji?: string | null) => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) return;

    // Update Firebase Auth photoURL if changed
    if (newPhotoURL !== undefined) {
      await firebaseUpdateProfile(firebaseUser, { photoURL: newPhotoURL || null });
    }

    // Trigger sidebar re-render
    useAuthStore.getState().setUser({
      ...firebaseUser,
      photoURL: newPhotoURL ?? firebaseUser.photoURL,
    } as any);

    // Update the user store profile too
    const currentProfile = useUserStore.getState().profile;
    if (currentProfile) {
      useUserStore.setState({
        profile: {
          ...currentProfile,
          photoURL: newPhotoURL ?? currentProfile.photoURL,
          avatarEmoji: newEmoji !== undefined ? newEmoji : currentProfile.avatarEmoji,
        },
      });
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    setError(null);
    setIsUploading(true);

    try {
      const resized = await resizeImage(file);
      const result = await userApi.uploadAvatar(resized);
      await syncToSidebar(result.photoURL, result.avatarEmoji);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [syncToSidebar]);

  const handleEmojiSelect = useCallback(async (emoji: string) => {
    setError(null);
    setIsUploading(true);

    try {
      const result = await userApi.setAvatarEmoji(emoji);
      await syncToSidebar(result.photoURL, result.avatarEmoji);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set emoji';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [syncToSidebar]);

  const handleRemove = useCallback(async () => {
    setError(null);
    setIsUploading(true);

    try {
      const result = await userApi.removeAvatar();
      await syncToSidebar(result.photoURL ?? undefined, result.avatarEmoji);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove avatar';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [syncToSidebar]);

  const hasCustomAvatar = !!avatarEmoji || !!profile?.photoURL;

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <div className="relative group">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
          {isUploading ? (
            <Loader2 className="h-5 w-5 text-[var(--text-tertiary)] animate-spin" />
          ) : avatarEmoji ? (
            <span className="text-3xl leading-none">{avatarEmoji}</span>
          ) : photoURL ? (
            <img
              src={photoURL}
              alt={displayName || 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-[var(--text-tertiary)]">
              {getInitials(displayName ?? null)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-[12px] gap-1.5"
          >
            <Camera className="h-3 w-3" />
            Upload photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => setEmojiOpen(true)}
            className="text-[12px] gap-1.5"
          >
            <Smile className="h-3 w-3" />
            Choose emoji
          </Button>
          {hasCustomAvatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUploading}
              onClick={handleRemove}
              className="text-[12px] gap-1.5 text-[var(--text-tertiary)] hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)]">
          JPG, PNG, GIF, or WebP. Max 2MB.
        </p>
        {error && (
          <p className="text-[11px] text-red-500">{error}</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Emoji picker dialog */}
      <EmojiPickerDialog
        open={emojiOpen}
        onOpenChange={setEmojiOpen}
        onSelect={handleEmojiSelect}
        currentEmoji={avatarEmoji}
      />
    </div>
  );
}
