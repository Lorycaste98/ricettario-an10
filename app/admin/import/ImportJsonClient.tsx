"use client";

import { useRef, useState } from "react";
import { FolderOpen, ClipboardList, TriangleAlert, CircleCheck } from "lucide-react";

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
    <div className="mx-auto max-w-xl space-y-6">
      {/* File picker — sempre visibile finché non si importa */}
      {(status === "idle" || status === "error") && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
          <FolderOpen size={28} className="mx-auto mb-1 text-gray-400" />
          <p className="mb-4 text-sm text-gray-500">
            Seleziona il file <code className="font-mono text-orange-600">ricettario.json</code> da
            importare
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
            <span>Scegli file</span>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          {status === "error" && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errorMsg}</p>
          )}
        </div>
      )}

      {/* Preview + conferma */}
      {(status === "preview" || status === "confirm") && preview && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-700"><ClipboardList size={15} /> Anteprima file</h2>
            <dl className="grid grid-cols-3 gap-4 text-center">
              <PreviewStat label="Categorie" value={preview.categories} />
              <PreviewStat label="Tag" value={preview.tags} />
              <PreviewStat label="Ricette" value={preview.recipes} />
            </dl>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700"><TriangleAlert size={15} /> Attenzione — operazione irreversibile</p>
            <p className="mt-1 text-xs text-red-600">
              Tutti i dati esistenti (ricette, categorie, tag e menù) verranno{" "}
              <strong>eliminati definitivamente</strong> e sostituiti con quelli del file
              selezionato. Gli account admin non vengono modificati.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleImport}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Sì, sostituisci tutto
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="text-sm text-gray-500">Importazione in corso… potrebbe richiedere qualche secondo.</p>
        </div>
      )}

      {/* Success */}
      {status === "success" && stats && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-green-700"><CircleCheck size={15} /> Importazione completata!</p>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <PreviewStat label="Categorie" value={stats.categories} color="green" />
            <PreviewStat label="Tag" value={stats.tags} color="green" />
            <PreviewStat label="Ricette" value={stats.recipes} color="green" />
          </dl>
          <button
            onClick={handleReset}
            className="mt-6 w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
          >
            Carica un altro file
          </button>
        </div>
      )}
    </div>
  );
}

function PreviewStat({
  label,
  value,
  color = "orange",
}: {
  label: string;
  value: number;
  color?: "orange" | "green";
}) {
  const numClass = color === "green" ? "text-green-600" : "text-orange-600";
  return (
    <div>
      <p className={`text-2xl font-bold ${numClass}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

