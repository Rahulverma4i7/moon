import { CompressResult } from "@/lib/compress";
import { formatBytes } from "@/lib/download";
import { ArrowDown } from "lucide-react";

interface Props {
    results: CompressResult[];
}

export function ResultsTable({ results }: Props) {
    const totalOrig = results.reduce((a, r) => a + r.originalSize, 0);
    const totalComp = results.reduce((a, r) => a + r.compressedSize, 0);
    const totalSaved = totalOrig - totalComp;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div>
                    <p className="text-lg font-semibold text-emerald-600">
                        {results.length} images compressed
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {formatBytes(totalOrig)} → {formatBytes(totalComp)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="flex items-center justify-end gap-1 text-2xl font-bold text-emerald-600">
                        <ArrowDown className="h-5 w-5" />
                        {formatBytes(totalSaved)}
                    </p>
                    <p className="text-sm text-muted-foreground">saved</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    File
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Original
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    WebP
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Saved
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs">
                                        {r.webpName}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                                        {formatBytes(r.originalSize)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium">
                                        {formatBytes(r.compressedSize)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-600">
                                        {r.savings.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}