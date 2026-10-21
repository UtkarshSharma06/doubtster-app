/**
 * Turns the legal markdown files in src/content/legal into the page HTML.
 * Supported: "## N. Title {#id}" sections, numbered clauses "**1.1 Label** text", blockquotes
 * (In short -> .tldr, everything else -> .callout), tables, bullet lists, address blocks,
 * [PLACEHOLDER] markers and <!-- owner notes --> (never rendered).
 */
import fs from "node:fs";
import path from "node:path";

import { LEGAL, type LegalKey } from "./legalMeta";
export { LEGAL, LEGAL_ORDER, type LegalKey } from "./legalMeta";

const LINKS: [string, string][] = [
  ["Cancellation and Refund Policy", "/refund-policy"],
  ["Privacy Policy", "/privacy"],
  ["Terms and Conditions", "/terms"],
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(t: string) {
  t = esc(t).replace(/—/g, ",").replace(/–/g, "-");
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  t = t.replace(/\[([A-Z][A-Z0-9 ,&/"'.\-]{2,}[A-Z".])\]/g, '<mark class="ph">[$1]</mark>');
  for (const [name, href] of LINKS) t = t.split(name).join(`<a href="${href}">${name}</a>`);
  t = t.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
  return t;
}

export type Toc = { id: string; title: string }[];
export type Converted = { title: string; meta: Record<string, string>; toc: Toc; body: string };

export function convert(md: string): Converted {
  const lines = md.split("\n");
  let i = 0;
  const out: string[] = [];
  const toc: Toc = [];
  const meta: Record<string, string> = {};
  let title = "";
  let openSec = false;
  const close = () => {
    if (openSec) { out.push("</section>"); openSec = false; }
  };

  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    if (ln.startsWith("<!--")) {
      while (!lines[i].includes("-->")) i++;
      i++;
      continue;
    }
    if (ln.startsWith("# ")) { title = ln.slice(2).trim(); i++; continue; }
    let m = ln.match(/^(Effective date|Last updated|Version):\s*(.*)/);
    if (m) { meta[m[1]] = m[2]; i++; continue; }

    if (ln.startsWith("## ")) {
      close();
      m = ln.match(/^## (\d+)\. (.+?) \{#(.+?)\}/);
      if (!m) { i++; continue; }
      const [, n, t, id] = m;
      toc.push({ id, title: t });
      out.push(
        `<section id="${id}"><h2><span class="num">${n}</span>${inline(t)}<button class="anchor" type="button" data-id="${id}" aria-label="Copy link to this section">#</button></h2>`
      );
      openSec = true; i++;
      continue;
    }

    if (ln.startsWith(">")) {
      const blk: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) { blk.push(lines[i].slice(1).trim()); i++; }
      const first = blk.find((b) => b) ?? "";
      const cls = first.includes("In short") ? "tldr" : "callout";
      const parts: string[] = [];
      let ul: string[] = [];
      for (const b of blk) {
        if (b.startsWith("- ")) { ul.push(`<li>${inline(b.slice(2))}</li>`); continue; }
        if (ul.length) { parts.push(`<ul>${ul.join("")}</ul>`); ul = []; }
        if (!b.trim()) continue;
        if (b.startsWith("**") && b.endsWith("**") && cls === "tldr") {
          parts.push(`<strong>${inline(b.replace(/^\*+|\*+$/g, "").replace(/:+$/, ""))}</strong>`);
        } else if (b.startsWith("**Important:**")) {
          parts.push(`<strong>Important</strong><p>${inline(b.slice("**Important:**".length).trim())}</p>`);
        } else {
          parts.push(b.includes("summary is for convenience") ? `<p class="fine2">${inline(b)}</p>` : `<p>${inline(b)}</p>`);
        }
      }
      if (ul.length) parts.push(`<ul>${ul.join("")}</ul>`);
      out.push(`<aside class="${cls}">${parts.join("")}</aside>`);
      continue;
    }

    if (ln.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      const th = rows[0].map((c) => `<th scope="col">${inline(c)}</th>`).join("");
      const tb = rows
        .slice(2)
        .map((r) => "<tr>" + r.map((c, k) => (k === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join("") + "</tr>")
        .join("");
      out.push(`<div class="tw"><table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`);
      continue;
    }

    if (ln.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(`<li>${inline(lines[i].slice(2))}</li>`); i++; }
      out.push(`<ul class="bl">${items.join("")}</ul>`);
      continue;
    }

    m = ln.match(/^\*\*(\d+\.\d+)(?: ([^*]+?))?\*\*\s*(.*)/);
    if (m) {
      const [, n, lab, rest] = m;
      out.push(`<p class="cl"><span class="cn">${n}</span><span>${lab ? `<b>${esc(lab)}</b> ` : ""}${inline(rest)}</span></p>`);
      i++;
      continue;
    }

    const blk: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|>|\||- |<!--)/.test(lines[i])) { blk.push(inline(lines[i])); i++; }
    if (!blk.length) { i++; continue; }
    out.push(`<p class="addr">${blk.join("<br>")}</p>`);
  }
  close();
  return { title, meta, toc, body: out.join("\n") };
}

export function loadLegal(key: LegalKey) {
  const md = fs.readFileSync(path.join(process.cwd(), "src/content/legal", `${key}.md`), "utf8");
  const c = convert(md);
  return {
    ...c,
    eff: inline(c.meta["Effective date"] ?? ""),
    upd: inline(c.meta["Last updated"] ?? ""),
    ver: esc(c.meta["Version"] ?? "1.0"),
  };
}
