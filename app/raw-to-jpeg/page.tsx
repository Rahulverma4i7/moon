"use client";

import { useState, useCallback } from "react";
import {
    convertRawBatch,
    type RawConvertResult,
    type RawBatchProgress,
} from "@/lib/raw-to-jpeg";
import { downloadBlob, formatBytes } from "@/lib/download";
import { ImageDropzone } from "@/components/image-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, RotateCcw, Camera, AlertCircle, Loader2 } from "lucide-react";

const RAW_EXTENSIONS = [
    ".cr2", ".cr3", ".nef", ".arw", ".dng", ".raf",
    ".orf", ".pef", ".rw2", ".srw", ".3fr", ".iiq",
];

export default function RawToJpegPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [results, setResults] = useState<RawConvertResult[] | null>(null);
    const [progress, setProgress] = useState<RawBatchProgress | null>(null);
    const [quality, setQuality] = useState(0.92);
    const [processing, setProcessing] = useState(false);

    const handleFiles = useCallback((selected: File[]) => {
        // Filter to RAW files only
        const rawFiles = selected.filter((f) => {
            const ext = f.name.toLowerCase().match(/\.\w+$/)?.[0] || "";
            return RAW_EXTENSIONS.includes(ext);
        });
        setFiles((prev) => [...prev, ...rawFiles]);
    }, []);

    const handleConvert = useCallback(async () => {
        if (files.length === 0) return;
        setProcessing(true);
        setResults(null);

        try {
            const converted = await convertRawBatch(files, quality, setProgress);
            setResults(converted);
        } catch (err) {
            console.error(err);
            alert("Conversion failed. Check console.");
        } finally {
            setProcessing(false);
        }
    }, [files, quality]);

    const handleDownloadAll = useCallback(async () => {
        if (!results) return;

        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        results.forEach((r) => {
            zip.file(r.jpegName, r.blob);
        });
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `jpeg-converted-${Date.now()}.zip`);
    }, [results]);

    const handleReset = useCallback(() => {
        setFiles([]);
        setResults(null);
        setProgress(null);
    }, []);

    // ===== Processing state =====
    if (processing && progress) {
        const pct = Math.round((progress.current / progress.total) * 100);
        return (
            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <h1 className="text-2xl font-bold">Converting RAW → JPEG</h1>

                <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Image {progress.current} of {progress.total}
                        </span>
                        <span className="font-mono font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />

                    <div className="flex items-center gap-2 pt-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="truncate font-mono text-xs text-muted-foreground">
                            {progress.currentFile}
                        </span>
                    </div>

                    {progress.errors.length > 0 && (
                        <div className="mt-4 space-y-1 rounded-lg bg-destructive/5 p-3">
                            {progress.errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Extracting embedded JPEG previews — this is fast, usually under a second per image.
                </p>
            </div>
        );
    }

    // ===== Results state =====
    if (results && results.length > 0) {
        const totalOrig = results.reduce((a, r) => a + r.originalSize, 0);
        const totalJpeg = results.reduce((a, r) => a + r.jpegSize, 0);

        return (
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Conversion Complete</h1>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Convert More
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                    <div>
                        <p className="text-lg font-semibold text-emerald-600">
                            {results.length} images converted
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {formatBytes(totalOrig)} → {formatBytes(totalJpeg)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">
                            {((1 - totalJpeg / totalOrig) * 100).toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground">smaller</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">RAW</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">JPEG</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Dimensions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                    <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs">
                                        {r.jpegName}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                                        {formatBytes(r.originalSize)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium">
                                        {formatBytes(r.jpegSize)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                                        {r.width}×{r.height}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Button onClick={handleDownloadAll} className="w-full" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download All as ZIP ({results.length} JPEGs)
                </Button>
            </div>
        );
    }

    // ===== Idle state =====
    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Camera className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">RAW → JPEG Converter</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Upload camera RAW files (CR2, CR3, NEF, ARW, DNG, RAF, ORF, PEF, RW2).
                    Extracts the full-resolution JPEG preview embedded by your camera — fast and lossless.
                </p>
            </div>

            {files.length === 0 ? (
                <>
                    <ImageDropzone onFilesSelected={handleFiles} />
                    <p className="text-center text-xs text-muted-foreground">
                        Supports Canon, Nikon, Sony, Fujifilm, Olympus, Pentax, Panasonic, and Adobe DNG
                    </p>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {files.length} RAW file{files.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({formatBytes(files.reduce((a, f) => a + f.size, 0))})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">JPEG Quality:</span>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(parseFloat(e.target.value))}
                                className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                            >
                                <option value="1.0">100% — Best quality</option>
                                <option value="0.95">95% — High quality</option>
                                <option value="0.92">92% — Recommended</option>
                                <option value="0.85">85% — Smaller files</option>
                            </select>
                        </div>

                        <div className="ml-auto flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                                Clear
                            </Button>
                            <Button size="sm" onClick={handleConvert}>
                                Convert All
                            </Button>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto rounded-2xl border border-border">
                        {files.map((file, i) => (
                            <div
                                key={`${file.name}-${i}`}
                                className="flex items-center justify-between border-b border-border px-4 py-2 last:border-0"
                            >
                                <span className="truncate font-mono text-xs">{file.name}</span>
                                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                                    {formatBytes(file.size)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}