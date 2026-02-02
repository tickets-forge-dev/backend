import { IndexSummary } from '@/services/github.service';
import { Check, X, FileText, TestTube, Code2, Settings } from 'lucide-react';

interface IndexingSummaryProps {
  summary: IndexSummary;
  filesIndexed: number;
  repoSizeMB: number;
  durationMs: number;
}

export function IndexingSummaryCard({ summary, filesIndexed, repoSizeMB, durationMs }: IndexingSummaryProps) {
  const durationSec = (durationMs / 1000).toFixed(2);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Check className="h-4 w-4 text-green-500" />
        <span>Indexing Complete</span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Files Indexed</p>
          <p className="text-lg font-semibold">{filesIndexed}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Repository Size</p>
          <p className="text-lg font-semibold">{repoSizeMB} MB</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="text-lg font-semibold">{durationSec}s</p>
        </div>
      </div>

      {/* Languages */}
      {summary.languagesDetected.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Code2 className="h-4 w-4" />
            <span>Languages Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.languagesDetected.map((lang) => (
              <span
                key={lang}
                className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        <FeatureIndicator
          icon={FileText}
          label="Documentation"
          hasFeature={summary.hasDocumentation}
          count={summary.documentationFiles.length}
        />
        <FeatureIndicator
          icon={TestTube}
          label="Tests"
          hasFeature={summary.hasTests}
          count={summary.testFiles.length}
        />
        <FeatureIndicator
          icon={Code2}
          label="API Spec"
          hasFeature={summary.hasApiSpec}
        />
        <FeatureIndicator
          icon={Settings}
          label="Config Files"
          hasFeature={summary.configFiles.length > 0}
          count={summary.configFiles.length}
        />
      </div>

      {/* Documentation Files */}
      {summary.hasDocumentation && summary.documentationFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Documentation Files:</p>
          <div className="flex flex-wrap gap-1">
            {summary.documentationFiles.slice(0, 3).map((file) => (
              <span key={file} className="text-xs text-muted-foreground">
                {file}
              </span>
            ))}
            {summary.documentationFiles.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{summary.documentationFiles.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FeatureIndicatorProps {
  icon: React.ElementType;
  label: string;
  hasFeature: boolean;
  count?: number;
}

function FeatureIndicator({ icon: Icon, label, hasFeature, count }: FeatureIndicatorProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
      <div className={`flex-shrink-0 ${hasFeature ? 'text-green-500' : 'text-muted-foreground'}`}>
        {hasFeature ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        {count !== undefined && count > 0 && (
          <p className="text-xs text-muted-foreground">{count} files</p>
        )}
      </div>
    </div>
  );
}
