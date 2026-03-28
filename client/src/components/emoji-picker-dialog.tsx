'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';

const EMOJI_CATEGORIES = [
  {
    name: 'Faces',
    emojis: [
      '😎', '🤓', '🧐', '🥸', '😏', '🤠', '🥳', '😈', '👻', '🤖',
      '👾', '💀', '🎃', '🫠', '🫡', '🤫', '🤔', '😴', '🥹', '😇',
      '🫣', '🤗', '🧠', '👀', '👁️', '🗿',
    ],
  },
  {
    name: 'People',
    emojis: [
      '🧑‍💻', '🧑‍🚀', '🧑‍🎨', '🧑‍🔬', '🧑‍🚒', '🧙', '🧛', '🧝', '🧞', '🥷',
      '🦸', '🦹', '🤺', '🧜', '🧚', '🏄', '🚴', '🤸', '🧗', '🏂',
    ],
  },
  {
    name: 'Animals',
    emojis: [
      '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐺', '🐸', '🐱', '🐶',
      '🐙', '🦑', '🦎', '🐊', '🦖', '🦕', '🐉', '🦄', '🐝', '🦋',
      '🐧', '🦅', '🦉', '🦇', '🐳', '🐬', '🦈', '🐢', '🦩', '🦚',
      '🦜', '🐿️', '🦔', '🐾', '🐡',
    ],
  },
  {
    name: 'Nature',
    emojis: [
      '🌊', '🔥', '❄️', '⚡', '🌙', '🌕', '☀️', '⭐', '🌟', '💫',
      '✨', '🌈', '🌸', '🌺', '🌻', '🍀', '🌵', '🍄', '🌿', '🪴',
      '🌍', '🪐', '🌋', '💎', '🔮', '🧊', '☁️', '🌴',
    ],
  },
  {
    name: 'Food',
    emojis: [
      '🍕', '🍔', '🌮', '🍣', '🍩', '🧁', '🍪', '🍦', '🥑', '🍋',
      '🍎', '🍑', '🍒', '🫐', '🥝', '🍉', '🥥', '☕', '🧋', '🍵',
      '🥤', '🧃', '🍷', '🎂', '🧇',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '🚀', '💡', '🔧', '⚙️', '🔬', '🔭', '💻', '🎮', '🕹️', '📡',
      '🛸', '🏎️', '✈️', '🛰️', '⛵', '🎯', '🏆', '🎨', '🎸', '🎹',
      '📸', '🔑', '🗝️', '🪄', '🧿', '💼', '🛡️', '⚔️', '🏹', '🪃',
      '🎪', '🎭', '📦', '🔮', '🎲',
    ],
  },
  {
    name: 'Symbols',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '♾️',
      '⚛️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🔶',
      '🔷', '🔺', '💠', '♠️', '♟️', '⚜️', '🔱', '🏴‍☠️',
    ],
  },
] as const;

interface EmojiPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string | null;
}

export function EmojiPickerDialog({ open, onOpenChange, onSelect, currentEmoji }: EmojiPickerDialogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(EMOJI_CATEGORIES[0].name);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES;
    // Simple filter — just show all emojis in a flat list when searching
    const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return [{ name: 'Results', emojis: allEmojis }];
  }, [search]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[520px] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-[var(--text)] text-sm font-medium">
            Choose an emoji
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-1 focus:ring-[var(--text-tertiary)]"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex gap-0.5 px-5 pb-2 overflow-x-auto scrollbar-thin">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`
                  px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors
                  ${activeCategory === cat.name
                    ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }
                `}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {filteredCategories.map((category) => {
            if (!search && category.name !== activeCategory) return null;
            return (
              <div key={category.name}>
                {search && (
                  <p className="text-[11px] font-medium text-[var(--text-tertiary)] mb-2">
                    {category.name}
                  </p>
                )}
                <div className="grid grid-cols-8 gap-0.5">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelect(emoji)}
                      className={`
                        h-10 w-10 flex items-center justify-center rounded-lg text-xl
                        transition-all hover:bg-[var(--bg-hover)] hover:scale-110
                        ${currentEmoji === emoji ? 'bg-[var(--bg-active)] ring-1 ring-[var(--text-tertiary)]' : ''}
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
