import { FaviconResult } from "@/lib/favicon";

interface Props {
    favicons: FaviconResult[];
}

export function FaviconPreviewGrid({ favicons }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favicons.map((f, i) => (
                <div
                    key={i}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5"
                >
                    {/* Checkerboard background for transparency */}
                    <div
                        className="flex items-center justify-center rounded-lg p-3"
                        style={{
                            backgroundImage:
                                "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                            backgroundSize: "12px 12px",
                            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                        }}
                    >
                        <img
                            src={f.url}
                            alt={f.size.label}
                            style={{
                                width: Math.min(f.size.size, 80),
                                height: Math.min(f.size.size, 80),
                                imageRendering: f.size.size <= 32 ? "pixelated" : "auto",
                            }}
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium">{f.size.label}</p>
                        <p className="text-xs text-muted-foreground">{f.size.purpose}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                            {f.size.filename}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}