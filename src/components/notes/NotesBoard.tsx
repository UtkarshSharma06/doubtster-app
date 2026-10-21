"use client";

import React from "react";
import { createRoot, Root } from "react-dom/client";
import { NotebookDoc, NotebookPage } from "@/lib/notebookSchema";
import { NotebookNotes } from "./NotebookNotes";

export interface NotesBoardProps {
  note: any;
  onMakeVideo?: () => void;
  onMakeDeck?: () => void;
  onMakeQuiz?: () => void;
  onClose?: () => void;
  onRetry?: () => void;
}

export function NotesBoard(props: NotesBoardProps) {
  const rawNote = props.note || {};

  // If note is already in the new NotebookDoc format with pages
  let notebookDoc: NotebookDoc;

  if (Array.isArray(rawNote.pages) && rawNote.pages.length > 0) {
    notebookDoc = rawNote as NotebookDoc;
  } else {
    // Gracefully adapt any transition object into structured notebook pages
    const blocks: any[] = [];

    if (rawNote.tldr) {
      blocks.push({
        type: "para",
        text: `==${rawNote.tldr}==`,
      });
    }

    if (Array.isArray(rawNote.sections)) {
      rawNote.sections.forEach((sec: any, sIdx: number) => {
        blocks.push({
          type: "heading",
          text: `${sIdx + 1}. ${sec.heading || "Key Concept"}`,
        });

        if (Array.isArray(sec.cards)) {
          sec.cards.forEach((c: any) => {
            if (c.type === "key" || c.type === "para") {
              blocks.push({ type: "para", text: c.text });
            } else if (c.type === "definition") {
              blocks.push({ type: "para", text: `**${c.term}:** ${c.text}` });
            } else if (c.type === "steps") {
              blocks.push({
                type: "steps",
                items: (c.items || []).map((it: any) => ({
                  say: it.step || it.say || "",
                  eq: it.math || it.eq || "",
                  why: it.why || "",
                })),
              });
            } else if (c.type === "formula") {
              blocks.push({
                type: "steps",
                items: [{ say: c.title || "Formula", eq: c.latex, why: c.note }],
              });
            } else if (c.type === "example") {
              blocks.push({
                type: "example",
                problem: c.title || "Worked Example",
                answer: c.text || "",
              });
            } else if (c.type === "warning") {
              blocks.push({ type: "mistakes", items: [c.text] });
            } else if (c.type === "tip") {
              blocks.push({ type: "margin", text: c.text, anchor: 0 });
            } else if (c.type === "points") {
              blocks.push({ type: "summary", items: c.items || [] });
            }
          });
        }
      });
    }

    if (blocks.length === 0) {
      blocks.push({
        type: "para",
        text: "Writing notes on notebook paper...",
      });
    }

    notebookDoc = {
      title: rawNote.title || "Study Notes",
      subject: rawNote.subject || "General",
      level: rawNote.level || "",
      language: rawNote.language || "en",
      pages: [{ blocks }],
      verified: rawNote.verified,
      verifiedNote: rawNote.verifiedNote,
      needsCheck: rawNote.needsCheck,
    };
  }

  return (
    <NotebookNotes
      note={notebookDoc}
      onClose={props.onClose}
      onRetry={props.onRetry}
      onMakeVideo={props.onMakeVideo}
      onMakeDeck={props.onMakeDeck}
      onMakeQuiz={props.onMakeQuiz}
    />
  );
}

/* ==========================================================================
   Imperative DOM Mounting Helpers
   ========================================================================== */

const notesRootRegistry = new Map<HTMLElement, Root>();

export function renderNotesMount(
  element: HTMLElement,
  props: NotesBoardProps
) {
  if (!element) return;
  let root = notesRootRegistry.get(element);
  if (!root) {
    root = createRoot(element);
    notesRootRegistry.set(element, root);
  }
  root.render(<NotesBoard {...props} />);
}

export function unmountNotes(element: HTMLElement) {
  if (!element) return;
  const root = notesRootRegistry.get(element);
  if (root) {
    try {
      root.unmount();
    } catch (e) {}
    notesRootRegistry.delete(element);
  }
}
