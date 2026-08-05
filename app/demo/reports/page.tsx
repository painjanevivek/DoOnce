"use client";

import Link from "next/link";
import { useState } from "react";

const reportRows = [
  ["Mon, 03 Aug", "North region", "1,284", "$18,462"],
  ["Tue, 04 Aug", "West region", "1,107", "$15,948"],
  ["Wed, 05 Aug", "Central region", "1,493", "$21,116"],
];

function downloadDemoCsv(): void {
  const csv = ["Date,Region,Orders,Revenue", ...reportRows.map((row) => row.join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "weekly-sales-report.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function DemoReportPage() {
  const [range, setRange] = useState("Current week");
  const [status, setStatus] = useState("Preview ready. No data is sent anywhere.");

  return (
    <main className="demo-page">
      <header className="demo-header">
        <Link href="/">← DoOnce dashboard</Link>
        <span>Demo fixture</span>
      </header>

      <section className="demo-intro" aria-labelledby="demo-title">
        <p className="eyebrow">Safe browser pattern</p>
        <h1 id="demo-title">Weekly sales report</h1>
        <p>This local-only fixture models a low-risk read-and-download workflow. It has no sign-in, hidden fields, final submission or real customer data.</p>
      </section>

      <section className="demo-card" aria-labelledby="report-controls-title">
        <div className="demo-card-heading">
          <div>
            <p className="card-label">Report centre</p>
            <h2 id="report-controls-title">Review before downloading</h2>
          </div>
          <span className="demo-badge">Read-only</span>
        </div>

        <div className="demo-controls">
          <label htmlFor="report-range">Reporting period</label>
          <select
            id="report-range"
            value={range}
            onChange={(event) => {
              setRange(event.target.value);
              setStatus(`${event.target.value} preview ready. No data is sent anywhere.`);
            }}
          >
            <option>Current week</option>
            <option>Previous week</option>
          </select>
          <button
            type="button"
            onClick={() => {
              downloadDemoCsv();
              setStatus("Download started. The generated CSV contains only demo data.");
            }}
          >
            Download CSV
          </button>
        </div>
        <p className="demo-status" aria-live="polite">{status}</p>

        <div className="table-wrap">
          <table>
            <caption>{range} sales-report preview</caption>
            <thead>
              <tr><th>Date</th><th>Region</th><th>Orders</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {reportRows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
