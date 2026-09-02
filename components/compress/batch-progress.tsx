import { BatchProgress } from "@/lib/compress";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
    progress: BatchProgress;
}

export function BatchProgressUI({ progress }: Props) {
    const pct = Math.round(
        (progress.overallProcessed / progress.totalFiles) * 100
    );

    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Compressing {progress.overallProcessed} of {progress.totalFiles}
                    </span>
                    <span className="font-mono text-sm font-medium">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
            </div>

            <div className="space-y-1.5">
                {Array.from({ length: progress.totalBatches }).map((_, i) => {
                    const num = i + 1;
                    const done = num < progress.currentBatch;
                    const current = num === progress.currentBatch;
                    const waiting = num > progress.currentBatch;

                    return (
                        <div
                            key={num}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${current
                                    ? "bg-primary/10 text-foreground"
                                    : done
                                        ? "text-muted-foreground"
                                        : "text-muted-foreground/30"
                                }`}
                        >
                            {done ? (
                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : current ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                            ) : (
                                <div className="h-4 w-4 shrink-0 rounded-full border border-current" />
                            )}
                            <span className="flex-1">Batch {num}</span>
                            <span className="text-xs font-mono">
                                {done ? "Done" : current ? "Working..." : "Waiting"}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}