'use client';

import type { ConfigStatus } from '@/core/config/types';

interface ConfigStatusBadgeProps {
  name: string;
  status: ConfigStatus;
  message: string;
  resolution?: string;
}

/**
 * Visual status indicator for configuration items
 */
export function ConfigStatusBadge({
  name,
  status,
  message,
  resolution,
}: ConfigStatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'valid':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-medium ${getStatusColor()}`}>
        <span>{getStatusIcon()}</span>
        <span className="font-semibold">{name}:</span>
        <span>{message}</span>
      </div>
      {resolution && (
        <div className="text-xs text-muted-foreground pl-6">
          → {resolution}
        </div>
      )}
    </div>
  );
}
