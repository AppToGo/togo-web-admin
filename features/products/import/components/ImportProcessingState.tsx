import { Loader2 } from "lucide-react";

interface ImportProcessingStateProps {
  fileName?: string;
}

export function ImportProcessingState({ fileName }: ImportProcessingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">
          Analizando con IA...
        </p>
        {fileName && (
          <p className="text-sm text-slate-500 mt-1 max-w-xs truncate">{fileName}</p>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Esto puede demorar unos segundos
        </p>
      </div>
    </div>
  );
}
