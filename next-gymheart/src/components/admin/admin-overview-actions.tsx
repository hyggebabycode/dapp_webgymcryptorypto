"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type RangeKey = "7d" | "30d" | "quarter";

type CsvRow = Record<string, string | number | null | undefined>;

type Props = {
  activeRange: RangeKey;
  csvRows: CsvRow[];
  report: {
    title: string;
    rangeLabel: string;
    generatedAt: string;
    stats: Array<{ label: string; value: string | number }>;
    alerts: string[];
  };
};

const ranges: Array<{ key: RangeKey; label: string }> = [
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "quarter", label: "Quý hiện tại" },
];

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminOverviewActions({ activeRange, csvRows, report }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState<"csv" | "report" | null>(null);

  const csvContent = useMemo(() => {
    if (csvRows.length === 0) {
      return "Loai,Ten,Trang thai,Thanh toan,So tien,Ngay\n";
    }

    const headers = Object.keys(csvRows[0]);
    const lines = [
      headers.map(escapeCsvValue).join(","),
      ...csvRows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ];
    return lines.join("\n");
  }, [csvRows]);

  function setRange(range: RangeKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  function exportCsv() {
    setExporting("csv");
    downloadTextFile(
      `gymheart-admin-${activeRange}-${new Date().toISOString().slice(0, 10)}.csv`,
      `\uFEFF${csvContent}`,
      "text/csv;charset=utf-8",
    );
    window.setTimeout(() => setExporting(null), 400);
  }

  function exportReport() {
    setExporting("report");
    const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #211016; padding: 32px; }
    h1 { color: #f42559; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #f7c7d5; padding: 10px; text-align: left; }
    th { background: #fff0f5; }
    .meta { color: #9c495e; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p class="meta">Khoảng thời gian: ${report.rangeLabel}</p>
  <p class="meta">Xuất lúc: ${report.generatedAt}</p>
  <table>
    <thead><tr><th>Chỉ số</th><th>Giá trị</th></tr></thead>
    <tbody>
      ${report.stats.map((item) => `<tr><td>${item.label}</td><td>${item.value}</td></tr>`).join("")}
    </tbody>
  </table>
  <h2>Cảnh báo vận hành</h2>
  <ul>${report.alerts.map((alert) => `<li>${alert}</li>`).join("")}</ul>
</body>
</html>`;
    downloadTextFile(
      `gymheart-report-${activeRange}-${new Date().toISOString().slice(0, 10)}.html`,
      html,
      "text/html;charset=utf-8",
    );
    window.setTimeout(() => setExporting(null), 400);
  }

  return (
    <div className="flex flex-col gap-3 md:items-end">
      <div className="flex flex-wrap gap-2">
        {ranges.map((range) => {
          const active = activeRange === range.key;
          return (
            <button
              className={`rounded-lg border px-4 py-2 text-sm font-black transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-pink-200 bg-white text-muted hover:border-primary hover:text-primary"
              }`}
              key={range.key}
              onClick={() => setRange(range.key)}
              type="button"
            >
              {range.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          className="h-10 rounded-lg border border-green-200 bg-green-50 px-4 text-sm font-black text-green-700 hover:bg-green-100"
          onClick={exportCsv}
          type="button"
        >
          {exporting === "csv" ? "Đang xuất..." : "Xuất CSV"}
        </button>
        <button
          className="h-10 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 hover:bg-blue-100"
          onClick={exportReport}
          type="button"
        >
          {exporting === "report" ? "Đang tạo..." : "Xuất báo cáo"}
        </button>
      </div>
    </div>
  );
}
