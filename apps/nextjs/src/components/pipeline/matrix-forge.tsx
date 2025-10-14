"use client";

import { useState } from "react";
import { StageCard } from "./stage-card";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Download, RotateCcw, Settings2 } from "lucide-react";
import { cn } from "@saasfly/ui";

interface MatrixCell {
  value: string;
  edited?: boolean;
}

interface MatrixRow {
  feature: string;
  cells: MatrixCell[];
}

interface MatrixForgeProps {
  competitors: string[];
  rows: MatrixRow[];
  onCellEdit?: (rowIndex: number, cellIndex: number, value: string) => void;
  onResetCell?: (rowIndex: number, cellIndex: number) => void;
  onExport?: () => void;
  onNormalizeCurrency?: () => void;
}

export function MatrixForge({
  competitors,
  rows,
  onCellEdit,
  onResetCell,
  onExport,
  onNormalizeCurrency,
}: MatrixForgeProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [showColumns, setShowColumns] = useState({
    features: true,
    pricing: true,
    integrations: true,
  });

  return (
    <StageCard
      title="Feature Matrix"
      status="approved"
      description="Features & Pricing comparison across Top-5 competitors"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-lg text-xs"
          >
            <Settings2 className="mr-1 h-3 w-3" />
            Column toggles
          </Button>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onNormalizeCurrency}
            className="h-7 rounded-lg text-xs"
          >
            Normalize: USD/mo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            className="h-7 rounded-lg text-xs"
          >
            <Download className="mr-1 h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="sticky left-0 bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-left text-xs font-semibold text-gray-900 min-w-[180px]">
                Feature
              </th>
              {competitors.map((competitor, idx) => (
                <th
                  key={idx}
                  className="border-l border-gray-200 px-3 py-2.5 text-left text-xs font-semibold text-gray-900 min-w-[140px]"
                >
                  {competitor}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                <td className="sticky left-0 bg-white border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900">
                  {row.feature}
                </td>
                {row.cells.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={cn(
                      "border-l border-gray-200 px-3 py-2.5 text-sm relative group",
                      cell.edited && "bg-yellow-50"
                    )}
                    onClick={() => setEditingCell({ row: rowIdx, col: cellIdx })}
                  >
                    {editingCell?.row === rowIdx && editingCell?.col === cellIdx ? (
                      <Input
                        autoFocus
                        defaultValue={cell.value}
                        onBlur={(e) => {
                          onCellEdit?.(rowIdx, cellIdx, e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onCellEdit?.(rowIdx, cellIdx, e.currentTarget.value);
                            setEditingCell(null);
                          }
                          if (e.key === "Escape") {
                            setEditingCell(null);
                          }
                        }}
                        className="h-7 text-sm rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-mono",
                            cell.value === "—" && "text-gray-400"
                          )}
                          title={cell.value === "—" ? "Not found" : undefined}
                        >
                          {cell.value}
                        </span>
                        {cell.edited && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResetCell?.(rowIdx, cellIdx);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RotateCcw className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Click any cell to edit • "—" indicates data not found
      </div>
    </StageCard>
  );
}
