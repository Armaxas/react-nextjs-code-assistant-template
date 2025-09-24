import React, { memo } from 'react';

interface DiffViewerProps {
  patch: string;
  filename: string;
}

const DiffViewer = memo(({ patch, filename }: DiffViewerProps) => {
  // Memoized diff rendering to prevent re-renders
  const diffLines = React.useMemo(() => {
    return patch.split('\n').map((line, lineIndex) => ({
      line,
      lineIndex,
      className: `${
        line.startsWith('+') && !line.startsWith('+++') 
          ? 'text-green-400 bg-green-900/20' 
          : line.startsWith('-') && !line.startsWith('---')
          ? 'text-red-400 bg-red-900/20'
          : line.startsWith('@@')
          ? 'text-blue-400 bg-blue-900/20'
          : 'text-gray-300'
      } px-1`
    }));
  }, [patch]);

  return (
    <div className="mt-3">
      <h4 className="text-xs font-medium text-gray-400 mb-2">
        Diff for {filename}:
      </h4>
      <pre className="text-xs bg-gray-900 border border-gray-600 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto font-mono">
        {diffLines.map(({ line, lineIndex, className }) => (
          <div key={lineIndex} className={className}>
            {line || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
});

DiffViewer.displayName = 'DiffViewer';

export default DiffViewer;
