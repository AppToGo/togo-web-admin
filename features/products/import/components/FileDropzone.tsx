"use client";

import { useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
];

const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export function FileDropzone({ onFileSelected, isLoading }: FileDropzoneProps) {
  const t = useTranslations("catalog.import.dropzone");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t("invalidType");
    }
    if (file.size > MAX_SIZE_BYTES) {
      return t("tooLarge");
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isLoading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors",
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40",
          isLoading && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <Upload className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {t("hint")}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t("subHint")}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleInputChange}
        disabled={isLoading}
      />

      {selectedFile && !error && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm text-slate-700 truncate flex-1">
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={clearFile}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
