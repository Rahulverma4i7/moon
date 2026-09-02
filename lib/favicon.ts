import JSZip from "jszip";

export interface FaviconSize {
  filename: string;
  size: number;
  label: string;
  purpose: string;
}

export const FAVICON_SIZES: FaviconSize[] = [
  { filename: "favicon-16x16.png", size: 16, label: "16×16", purpose: "Standard favicon" },
  { filename: "favicon-32x32.png", size: 32, label: "32×32", purpose: "Standard favicon" },
  { filename: "apple-touch-icon.png", size: 180, label: "180×180", purpose: "iOS home screen" },
  { filename: "android-chrome-192x192.png", size: 192, label: "192×192", purpose: "Android Chrome" },
  { filename: "android-chrome-512x512.png", size: 512, label: "512×512", purpose: "Android splash" },
  { filename: "mstile-150x150.png", size: 150, label: "150×150", purpose: "Windows tile" },
];

function resizeImage(
  img: HTMLImageElement,
  size: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
if (!ctx) {
  reject(new Error(`Canvas not supported for ${size}x${size}`));
  return;
}
ctx.drawImage(img, 0, 0, size, size);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to create ${size}x${size}`));
      },
      "image/png"
    );
  });
}

function createIco(pngBlob: Blob, size: number): Promise<Blob> {
  return pngBlob.arrayBuffer().then((buffer) => {
    const pngData = new Uint8Array(buffer);

    // ICO header: reserved(2) + type(2) + count(2) = 6 bytes
    const header = new ArrayBuffer(6);
    const hv = new DataView(header);
    hv.setUint16(0, 0, true);
    hv.setUint16(2, 1, true); // type = ICO
    hv.setUint16(4, 1, true); // 1 image

    // Directory entry: 16 bytes
    const entry = new ArrayBuffer(16);
    const ev = new DataView(entry);
    ev.setUint8(0, size >= 256 ? 0 : size);
    ev.setUint8(1, size >= 256 ? 0 : size);
    ev.setUint8(2, 0);
    ev.setUint8(3, 0);
    ev.setUint16(4, 1, true);
    ev.setUint16(6, 32, true);
    ev.setUint32(8, pngData.byteLength, true);
    ev.setUint32(12, 22, true); // offset = 6 + 16

    return new Blob([header, entry, pngData], { type: "image/x-icon" });
  });
}

async function createSvgFavicon(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas not supported for SVG favicon");
}
ctx.drawImage(img, 0, 0, 512, 512);
  const dataUrl: string = await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob!);
    }, "image/png");
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image href="${dataUrl}" width="512" height="512"/></svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

function createWebmanifest(): string {
  return JSON.stringify(
    {
      name: "",
      short_name: "",
      icons: [
        { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    },
    null,
    2
  );
}

export interface FaviconResult {
  size: FaviconSize;
  blob: Blob;
  url: string;
}

export async function generateFavicons(
  file: File
): Promise<{ favicons: FaviconResult[]; zipBlob: Blob }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    const url = URL.createObjectURL(file);
    i.onload = () => {
      URL.revokeObjectURL(url);
      resolve(i);
    };
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    i.src = url;
  });

  // Generate all PNG sizes
  const favicons: FaviconResult[] = [];
  for (const size of FAVICON_SIZES) {
    const blob = await resizeImage(img, size.size);
    favicons.push({
      size,
      blob,
      url: URL.createObjectURL(blob),
    });
  }

  // Generate ICO from the 32x32
  const png32 = favicons.find((f) => f.size.size === 32)!;
  const icoBlob = await createIco(png32.blob, 32);
  const icoUrl = URL.createObjectURL(icoBlob);

  // Generate SVG
  const svgBlob = await createSvgFavicon(img);
  const svgUrl = URL.createObjectURL(svgBlob);

  // Build ZIP
  const zip = new JSZip();
  const folder = zip.folder("favicons")!;

  favicons.forEach((f) => {
    folder.file(f.size.filename, f.blob);
  });
  folder.file("favicon.ico", icoBlob);
  folder.file("favicon.svg", svgBlob);
  folder.file("site.webmanifest", createWebmanifest());

  const zipBlob = await zip.generateAsync({ type: "blob" });

  // Add ico and svg to results for preview
  favicons.push(
    {
      size: { filename: "favicon.ico", size: 32, label: "ICO", purpose: "Legacy browsers" },
      blob: icoBlob,
      url: icoUrl,
    },
    {
      size: { filename: "favicon.svg", size: 512, label: "SVG", purpose: "Modern browsers" },
      blob: svgBlob,
      url: svgUrl,
    }
  );

  return { favicons, zipBlob };
}