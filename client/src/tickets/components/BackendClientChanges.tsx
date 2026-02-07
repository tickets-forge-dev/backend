'use client';

import { Server, Monitor, FolderOpen, Settings, FileText, FilePlus, FileCode, FileX } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { EditableItem } from './EditableItem';

interface LayerFile {
  path: string;
  action: string;
}

interface BackendClientChangesProps {
  backendChanges: LayerFile[];
  frontendChanges: LayerFile[];
  sharedChanges?: LayerFile[];
  infrastructureChanges?: LayerFile[];
  documentationChanges?: LayerFile[];
  onEdit: (layer: string, index: number) => void;
  onDelete: (layer: string, index: number) => void;
}

const ACTION_CONFIG: Record<string, { Icon: typeof FilePlus; color: string; label: string }> = {
  create: { Icon: FilePlus, color: 'text-green-500', label: 'Create' },
  modify: { Icon: FileCode, color: 'text-amber-500', label: 'Modify' },
  delete: { Icon: FileX, color: 'text-red-500', label: 'Delete' },
};

function FileList({
  files,
  layer,
  onEdit,
  onDelete,
}: {
  files: LayerFile[];
  layer: string;
  onEdit: (layer: string, index: number) => void;
  onDelete: (layer: string, index: number) => void;
}) {
  if (files.length === 0) {
    return (
      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic pl-1">
        No changes
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {files.map((fc, idx) => {
        const actionKey = fc.action || 'modify';
        const config = ACTION_CONFIG[actionKey] || ACTION_CONFIG.modify;
        const { Icon, color } = config;
        const parts = fc.path.split('/');
        const fileName = parts.pop() || fc.path;
        const dirPath = parts.length > 0 ? parts.join('/') + '/' : '';

        return (
          <li key={idx}>
            <EditableItem onEdit={() => onEdit(layer, idx)} onDelete={() => onDelete(layer, idx)}>
              <div className="flex items-center gap-2 text-[var(--text-sm)]">
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                <span className="font-mono">
                  <span className="text-[var(--text-tertiary)]">{dirPath}</span>
                  <span className="text-[var(--text-secondary)] font-medium">{fileName}</span>
                </span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {actionKey}
                </Badge>
              </div>
            </EditableItem>
          </li>
        );
      })}
    </ul>
  );
}

const LAYERS: Array<{
  key: string;
  label: string;
  Icon: typeof Server;
  propKey: keyof BackendClientChangesProps;
}> = [
  { key: 'backend', label: 'Backend', Icon: Server, propKey: 'backendChanges' },
  { key: 'frontend', label: 'Frontend', Icon: Monitor, propKey: 'frontendChanges' },
  { key: 'shared', label: 'Shared', Icon: FolderOpen, propKey: 'sharedChanges' },
  { key: 'infrastructure', label: 'Infrastructure', Icon: Settings, propKey: 'infrastructureChanges' },
  { key: 'documentation', label: 'Documentation', Icon: FileText, propKey: 'documentationChanges' },
];

export function BackendClientChanges(props: BackendClientChangesProps) {
  const { onEdit, onDelete } = props;

  // Only show layers that have files
  const visibleLayers = LAYERS.filter(({ propKey }) => {
    const files = props[propKey] as LayerFile[] | undefined;
    return files && files.length > 0;
  });

  if (visibleLayers.length === 0) {
    return (
      <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
        No file changes categorized.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visibleLayers.map(({ key, label, Icon, propKey }) => {
        const files = (props[propKey] as LayerFile[] | undefined) || [];
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <h4 className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                {label}
                <span className="ml-1.5 text-[var(--text-tertiary)]/60 normal-case font-normal">
                  ({files.length})
                </span>
              </h4>
            </div>
            <FileList files={files} layer={key} onEdit={onEdit} onDelete={onDelete} />
          </div>
        );
      })}
    </div>
  );
}
