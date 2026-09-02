"use client";

import { useState, useCallback } from "react";
import { compressBatch, type CompressResult, type BatchProgress } from "@/lib/compress";
import { downloadBlob, formatBytes } from "@/lib/download";
import { ImageDropzone } from "@/components/image-dropzone";
import { BatchProgressUI } from "@/components/compress/batch-progress";
import { ResultsTable } from "@/components/compress/results-table";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Images, Zap } from "lucide-react";

export default function CompressPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [results, setResults] = useState<CompressResult[] | null>(null);
    const [progress, setProgress] = useState<BatchProgress | null>(null);
    const [quality, setQuality] = useState(0.82);
    const [processing, setProcessing] = useState(false);

    const handleFiles = useCallback((selected: File[]) => {
        setFiles((prev) => [...prev, ...selected]);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleCompress = useCallback(async () => {
        if (files.length === 0) return;
        setProcessing(true);
        setResults(null);

        try {
            const compressed = await compressBatch(files, quality, 10, setProgress);
            setResults(compressed);
        } catch (err) {
            console.error("Compression failed:", err);
            alert("Some images failed to compress. Check console for details.");
        } finally {
            setProcessing(false);
        }
    }, [files, quality]);

    const handleDownloadAll = useCallback(() => {
        if (!results) return;

        // Dynamic import to keep JSZip out of initial bundle
        import("jszip").then(async (JSZip) => {
            const zip = new JSZip.default();
            results.forEach((r) => {
                zip.file(r.webpName, r.compressedBlob);
            });
            const blob = await zip.generateAsync({ type: "blob" });
            downloadBlob(blob, `webp-compressed-${Date.now()}.zip`);
        });
    }, [results]);

    const handleReset = useCallback(() => {
        setFiles([]);
        setResults(null);
        setProgress(null);
    }, []);

    // ===== Processing state =====
    if (processing && progress) {
        return (
            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <h1 className="text-2xl font-bold">Compressing Images</h1>
                <BatchProgressUI progress={progress} />
            </div>
        );
    }

    // ===== Results state =====
    if (results) {
        return (
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Results</h1>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Compress More
                    </Button>
                </div>

                <ResultsTable results={results} />

                <Button onClick={handleDownloadAll} className="w-full" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download All as ZIP ({results.length} files)
                </Button>
            </div>
        );
    }

    // ===== Idle state =====
    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">Compress to WebP</h1>
                <p className="text-sm text-muted-foreground">
                    Upload up to 50 images. Compressed in batches of 10. All processing
                    happens in your browser — nothing leaves your machine.
                </p>
            </div>

            {files.length === 0 ? (
                <ImageDropzone onFilesSelected={handleFiles} />
            ) : (
                <div className="space-y-4">
                    {/* Controls bar */}
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Images className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {files.length} image{files.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({formatBytes(files.reduce((a, f) => a + f.size, 0))})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Quality:</span>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(parseFloat(e.target.value))}
                                className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                            >
                                <option value="0.90">90% — Larger file</option>
                                <option value="0.85">85% — High quality</option>
                                <option value="0.82">82% — Best balance</option>
                                <option value="0.75">75% — Smallest file</option>
                            </select>
                        </div>

                        <div className="ml-auto flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                                Clear
                            </Button>
                            <Button size="sm" onClick={handleCompress}>
                                <Zap className="mr-2 h-4 w-4" />
                                Compress All
                            </Button>
                        </div>
                    </div>

                    {/* File list */}
                    <div className="max-h-60 overflow-y-auto rounded-2xl border border-border">
                        {files.map((file, i) => (
                            <div
                                key={`${file.name}-${i}`}
                                className="flex items-center justify-between border-b border-border px-4 py-2 last:border-0"
                            >
                                <span className="truncate font-mono text-xs">{file.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                        {formatBytes(file.size)}
                                    </span>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add more */}
                    <ImageDropzone
                        onFilesSelected={handleFiles}
                        disabled={files.length >= 50}
                    />
                    {files.length >= 50 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Maximum 50 images reached
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}