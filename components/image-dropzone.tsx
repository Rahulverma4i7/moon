"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
    onFilesSelected: (files: File[]) => void;
    multiple?: boolean;
    accept?: string;
    disabled?: boolean;
}

export function ImageDropzone({
    onFilesSelected,
    multiple = true,
    accept = "image/png,image/jpeg,image/webp,image/jpg",
    disabled = false,
}: Props) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return;
            const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
            if (files.length > 0) onFilesSelected(files);
        },
        [onFilesSelected]
    );

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (!disabled) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => !disabled && inputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />

            <div
                className={`mb-4 rounded-full p-4 transition-colors ${dragOver ? "bg-primary/10" : "bg-muted"
                    }`}
            >
                <Upload className="h-6 w-6 text-muted-foreground" />
            </div>

            <p className="mb-1 text-sm font-medium">
                {dragOver ? "Drop images here" : "Drag & drop images"}
            </p>
            <p className="text-xs text-muted-foreground">
                or click to browse · PNG, JPG, WebP
            </p>
        </div>
    );
}