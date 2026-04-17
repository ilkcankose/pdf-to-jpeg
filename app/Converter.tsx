"use client";

import { useCallback, useRef, useState } from "react";

type GeneratedFile = {
  name: string;
  blob: Blob;
  url: string;
  kb: number;
  quality: number;
  scale: number;
};

export default function Converter() {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [status, setStatus] = useState("Hazır.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [maxKb, setMaxKb] = useState(500);
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<GeneratedFile[]>([]);

  const appendFile = (g: GeneratedFile) => {
    filesRef.current = [...filesRef.current, g];
    setFiles([...filesRef.current]);
  };

  const reset = () => {
    filesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
    filesRef.current = [];
    setFiles([]);
    setStatus("Hazır.");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (busy) return;
      setBusy(true);
      const maxBytes = Math.max(50, maxKb) * 1024;

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      try {
        for (const file of Array.from(fileList)) {
          if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
          ) {
            continue;
          }
          await processPdf(pdfjs, file, maxBytes, (p, s) => {
            setProgress(p);
            setStatus(s);
          }, appendFile);
        }
        setStatus(`Tamamlandı. ${filesRef.current.length} JPEG üretildi.`);
        setProgress(100);
      } catch (err) {
        console.error(err);
        setStatus("Hata: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setBusy(false);
      }
    },
    [busy, maxKb]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHover(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const downloadAll = async () => {
    if (!filesRef.current.length) return;
    setStatus("ZIP hazırlanıyor…");
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    filesRef.current.forEach((f) => zip.file(f.name, f.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pdf-jpegs.zip";
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`ZIP indirildi (${filesRef.current.length} dosya).`);
  };

  return (
    <div>
      <label
        className={`drop ${hover ? "hover" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
      >
        <p>
          <strong>PDF'i buraya sürükle</strong> veya tıkla
        </p>
        <small>Birden fazla dosya seçebilirsin</small>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) =>
            e.target.files && e.target.files.length && handleFiles(e.target.files)
          }
        />
      </label>

      <div className="controls">
        <label>
          Maks. boyut (KB):{" "}
          <input
            type="number"
            value={maxKb}
            min={50}
            max={5000}
            onChange={(e) => setMaxKb(parseInt(e.target.value) || 500)}
          />
        </label>
        <button
          onClick={downloadAll}
          disabled={!files.length || busy}
        >
          Hepsini ZIP olarak indir
        </button>
        <button className="secondary" onClick={reset} disabled={busy}>
          Temizle
        </button>
      </div>

      <div className="status">{status}</div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="results">
        {files.map((f) => (
          <div key={f.url} className="card">
            <img src={f.url} alt={f.name} />
            <div className="name">{f.name}</div>
            <div className="meta">
              {f.kb} KB · q={f.quality} · x{f.scale}
            </div>
            <a className="dl-btn" href={f.url} download={f.name}>
              ↓ İNDİR
            </a>
          </div>
        ))}
      </div>

      <style>{`
        .drop {
          display: block;
          border: 2px dashed #bbb;
          border-radius: 12px;
          padding: 48px 20px;
          text-align: center;
          background: #fff;
          cursor: pointer;
          transition: all 0.15s;
        }
        .drop.hover { border-color: #f4a51d; background: #fff7e6; }
        .drop p { margin: 8px 0; }
        .drop small { color: #888; }
        .drop input[type=file] { display: none; }

        .controls {
          margin: 20px 0;
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .controls label { font-size: 13px; color: #444; }
        .controls input[type=number] {
          width: 80px;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 13px;
          margin-left: 4px;
        }
        button {
          background: #f4a51d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.15s;
        }
        button:hover:not(:disabled) { background: #d88d0f; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        button.secondary {
          background: transparent;
          color: #f4a51d;
          border: 1px solid #f4a51d;
        }
        button.secondary:hover:not(:disabled) {
          background: #fff7e6;
        }

        .status { margin: 16px 0 4px; font-size: 14px; color: #333; }
        .bar {
          width: 100%;
          height: 6px;
          background: #eee;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .bar-fill {
          height: 100%;
          background: #f4a51d;
          transition: width 0.2s;
        }

        .results {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .card {
          background: white;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          font-size: 12px;
        }
        .card img {
          width: 100%;
          height: 140px;
          object-fit: contain;
          background: #f4f4f4;
          border-radius: 4px;
          margin-bottom: 6px;
        }
        .card .name {
          font-weight: 600;
          margin-bottom: 2px;
          word-break: break-all;
        }
        .card .meta { color: #888; margin-bottom: 10px; }
        .card .dl-btn {
          display: block;
          background: #f4a51d;
          color: white;
          text-decoration: none;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          transition: background 0.15s;
        }
        .card .dl-btn:hover { background: #d88d0f; }
      `}</style>
    </div>
  );
}

async function processPdf(
  pdfjs: typeof import("pdfjs-dist"),
  file: File,
  maxBytes: number,
  onProgress: (percent: number, status: string) => void,
  onPage: (g: GeneratedFile) => void
) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const baseName = file.name.replace(/\.pdf$/i, "");
  const total = pdf.numPages;

  for (let i = 1; i <= total; i++) {
    onProgress(((i - 1) / total) * 100, `${file.name} — sayfa ${i}/${total}…`);
    const page = await pdf.getPage(i);
    const { blob, kb, quality, scale } = await renderUnderLimit(page, maxBytes);
    const name = `${baseName}_sayfa-${String(i).padStart(3, "0")}.jpg`;
    const url = URL.createObjectURL(blob);
    onPage({ name, blob, url, kb, quality, scale });
    onProgress((i / total) * 100, `${file.name} — sayfa ${i}/${total}`);
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function renderUnderLimit(
  page: import("pdfjs-dist").PDFPageProxy,
  maxBytes: number
) {
  const baseScale = 2.0;
  const qualities = [0.92, 0.85, 0.78, 0.7, 0.6, 0.5, 0.4, 0.3];
  const scaleSteps = [1.0, 0.85, 0.72, 0.6, 0.5, 0.4, 0.32];

  for (const sMul of scaleSteps) {
    const { canvas } = await renderCanvas(page, baseScale * sMul);
    for (const q of qualities) {
      const blob = await canvasToBlob(canvas, q);
      if (blob && blob.size <= maxBytes) {
        return {
          blob,
          kb: Math.round(blob.size / 1024),
          quality: q,
          scale: +(baseScale * sMul).toFixed(2),
        };
      }
    }
  }

  const { canvas } = await renderCanvas(page, baseScale * 0.25);
  const blob = (await canvasToBlob(canvas, 0.3))!;
  return {
    blob,
    kb: Math.round(blob.size / 1024),
    quality: 0.3,
    scale: +(baseScale * 0.25).toFixed(2),
  };
}

async function renderCanvas(
  page: import("pdfjs-dist").PDFPageProxy,
  scale: number
) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
}
