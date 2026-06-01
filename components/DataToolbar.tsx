"use client";

import { useRef, useState } from "react";
import type { ScenarioData } from "@/lib/dataIO";
import { downloadJson, parseImportedScenario } from "@/lib/dataIO";
import { Button } from "./ui";

interface DataToolbarProps {
  data: ScenarioData;
  onImport: (data: ScenarioData) => void;
}

export function DataToolbar({ data, onImport }: DataToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExport = () => {
    downloadJson(data);
    showFeedback("Wyeksportowano dane do pliku JSON.", "success");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = parseImportedScenario(JSON.parse(content));
      onImport(parsed);
      showFeedback("Zaimportowano dane z pliku JSON.", "success");
    } catch (err) {
      showFeedback(
        err instanceof Error ? err.message : "Nie udało się zaimportować pliku.",
        "error"
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="text-xs" onClick={handleExport}>
          Eksport JSON
        </Button>
        <Button variant="secondary" className="text-xs" onClick={handleImportClick}>
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {feedback && (
        <p
          className={`mt-2 text-xs ${
            feedback.type === "success" ? "text-profit" : "text-cost"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
