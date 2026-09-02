"use client";

import { useState, useCallback } from "react";
import { generateFavicons, type FaviconResult } from "@/lib/favicon";
import { downloadBlob } from "@/lib/download";
import { ImageDropzone } from "@/components/image-dropzone";
import { FaviconPreviewGrid } from "@/components/favicon/preview-grid";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Loader2 } from "lucide-react";

export default function FaviconGenPage() {
    const [file, setFile] = useState<File | null>(null);
    const [favicons, setFavicons] = useState<FaviconResult[] | null>(null);
    const [zipBlob, setZipBlob] = useState<Blob | null>(null);
    const [generating, setGenerating] = useState(false);

    const handleFile = useCallback((files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setFavicons(null);
            setZipBlob(null);
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!file) return;
        setGenerating(true);

        try {
            const result = await generateFavicons(file);
            setFavicons(result.favicons);
            setZipBlob(result.zipBlob);
        } catch (err) {
            console.error("Favicon generation failed:", err);
            alert("Failed to generate favicons. Check console.");
        } finally {
            setGenerating(false);
        }
    }, [file]);

    const handleDownload = useCallback(() => {
        if (zipBlob) {
            downloadBlob(zipBlob, `favicons-${Date.now()}.zip`);
        }
    }, [zipBlob]);

    const handleReset = useCallback(() => {
        setFile(null);
        setFavicons(null);
        setZipBlob(null);
    }, []);

    // ===== Generating state =====
    if (generating) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating favicons...</p>
            </div>
        );
    }

    // ===== Results state =====
    if (favicons && zipBlob) {
        return (
            <div className="mx-auto max-w-4xl space-y-8 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Your Favicons</h1>
                        <p className="text-sm text-muted-foreground">
                            {favicons.length} files generated from {file?.name}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        New Image
                    </Button>
                </div>

                <FaviconPreviewGrid favicons={favicons} />

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="mb-2 text-sm font-medium">What's in the ZIP:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                        <span>favicon.ico</span>
                        <span>favicon.svg</span>
                        <span>favicon-16x16.png</span>
                        <span>favicon-32x32.png</span>
                        <span>apple-touch-icon.png</span>
                        <span>android-chrome-192x192.png</span>
                        <span>android-chrome-512x512.png</span>
                        <span>mstile-150x150.png</span>
                        <span>site.webmanifest</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Drop the <code className="rounded bg-muted px-1 py-0.5">favicons/</code> folder
                        into your project's <code className="rounded bg-muted px-1 py-0.5">public/</code> directory.
                    </p>
                </div>

                <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download ZIP
                </Button>
            </div>
        );
    }

    // ===== Idle state =====
    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">Favicon Generator</h1>
                <p className="text-sm text-muted-foreground">
                    Upload one square image. Get all favicon sizes plus ICO, SVG, and
                    site.webmanifest — ready to drop into your public folder.
                </p>
            </div>

            {!file ? (
                <ImageDropzone onFilesSelected={handleFile} multiple={false} />
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="h-12 w-12 rounded-lg border border-border object-cover"
                            />
                            <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                Change
                            </Button>
                            <Button size="sm" onClick={handleGenerate}>
                                Generate Favicons
                            </Button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        For best results, use a square PNG at least 512×512px
                    </p>
                </div>
            )}
        </div>
    );
}