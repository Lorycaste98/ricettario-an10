"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { CircleCheck, ClipboardList, LoaderCircle, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { Panel } from "@/components/ds/Panel";

interface ImportStats {
  categories: number;
  tags: number;
  recipes: number;
  imported: number;
}

interface JsonPreview {
  categories: number;
  tags: number;
  recipes: number;
}

type Status = "idle" | "preview" | "confirm" | "loading" | "success" | "error";

export default function ImportJsonClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<JsonPreview | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedData, setParsedData] = useState<any>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [dragging, setDragging] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (
          !Array.isArray(data.categories) ||
          !Array.isArray(data.ingTags) ||
          !Array.isArray(data.recipes)
        ) {
          setErrorMsg(
            'Struttura JSON non valida. Il file deve contenere "categories", "ingTags" e "recipes".'
          );
          setStatus("error");
          return;
        }
        setPreview({
          categories: data.categories.length,
          tags: data.ingTags.length,
          recipes: data.recipes.length,
        });
        setParsedData(data);
        setStatus("preview");
      } catch {
        setErrorMsg("Il file non è un JSON valido.");
        setStatus("error");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Errore sconosciuto dal server.");
        setStatus("error");
        return;
      }
      setStats(json.stats);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Errore di rete.");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setPreview(null);
    setParsedData(null);
    setStats(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {/* 12.9 · importa file: si trascina il file o lo si sceglie */}
      {(status === "idle" || status === "error") && (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) readFile(file);
            }}
            className={clsx(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-card border-2 border-dashed px-4 py-10 text-center transition-colors",
              dragging ? "border-blu-600 bg-blu-100" : "border-blu-250 bg-white hover:bg-blu-50"
            )}
          >
            <Upload className="mb-1 size-8 text-blu-600" aria-hidden />
            <span className="font-bold">Trascina qui il file JSON</span>
            <span className="text-grigio">
              oppure <span className="font-bold text-blu-600">scegli file</span>
            </span>
            <input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileChange} />
          </label>
          {status === "error" && (
            <p role="alert" className="rounded-[0.625rem] border border-rosa-200 bg-rosa-50 px-3 py-2 text-rosa">
              {errorMsg}
            </p>
          )}
        </>
      )}

      {(status === "preview" || status === "confirm") && preview && (
        <>
          <Panel title="Nel file" icon={<ClipboardList />}>
            <dl className="grid grid-cols-3 gap-3 text-center">
              <PreviewStat label="Categorie" value={preview.categories} />
              <PreviewStat label="Tag" value={preview.tags} />
              <PreviewStat label="Ricette" value={preview.recipes} />
            </dl>
          </Panel>
          <div className="rounded-card border border-rosa-200 bg-rosa-50 p-3.5 text-rosa">
            <p className="flex items-center gap-1.5 font-bold">
              <TriangleAlert className="size-4" aria-hidden /> Non si può annullare
            </p>
            <p className="mt-1 text-[0.875rem]">
              Ricette, categorie, tag e menù di adesso vengono <strong>eliminati</strong> e sostituiti con quelli del file. Gli account restano.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleReset}>
              Annulla
            </Button>
            <Button variant="dangerSolid" onClick={handleImport}>
              Sì, sostituisci tutto
            </Button>
          </div>
        </>
      )}

      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-blu-150 bg-white p-10 text-center text-grigio">
          <LoaderCircle className="size-8 animate-spin text-blu-600 motion-reduce:animate-none" aria-hidden />
          Importazione in corso… può richiedere qualche secondo.
        </div>
      )}

      {status === "success" && stats && (
        <div className="flex flex-col gap-3 rounded-card border border-verde-200 bg-verde-50 p-4">
          <p className="flex items-center gap-1.5 font-bold text-verde">
            <CircleCheck className="size-4" aria-hidden /> Importazione completata
          </p>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <PreviewStat label="Categorie" value={stats.categories} />
            <PreviewStat label="Tag" value={stats.tags} />
            <PreviewStat label="Ricette" value={stats.recipes} />
          </dl>
          <Button variant="secondary" onClick={handleReset} className="self-end">
            Carica un altro file
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-(length:--fs-meta) text-grigio">{label}</dt>
      <dd className="tabular text-[1.625rem] leading-tight font-bold">{value}</dd>
    </div>
  );
}
