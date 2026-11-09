import React from "react";

interface TableBlockProps {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  highlightRows?: number[];
}

export function TableBlock({ title, columns, rows, highlightRows = [] }: TableBlockProps) {
  return (
    <div className="fig" style={{ margin: "16px 0" }}>
      <div className="fh">
        <b>{title}</b>
        <span>data table</span>
      </div>
      <div style={{ maxHeight: "320px", overflow: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className={highlightRows.includes(rIdx) ? "hl" : ""}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

