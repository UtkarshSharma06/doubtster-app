"use client";

import React from "react";
import { FollowUp } from "@/lib/chat/schema";
import { RefChip } from "./blocks/RefChip";
import { ComparisonTrajectoryChart } from "./charts/ComparisonTrajectoryChart";
import { AnalogyChart } from "./charts/AnalogyChart";

interface FollowUpCardProps {
  followUp: FollowUp;
  onFollowUpClick?: (text: string) => void;
}

export function FollowUpCard({ followUp, onFollowUpClick }: FollowUpCardProps) {
  return (
    <div className="content fu msg in">
      {/* Reference Chip linking to previous step */}
      {followUp.refersTo && (
        <RefChip
          stepId={followUp.refersTo.stepId}
          label={followUp.refersTo.label}
        />
      )}

      {/* Explanatory text */}
      {followUp.text && (
        <div>
          {followUp.text.split("\n\n").map((para, i) => (
            <p key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {/* Timeline (e.g. going up 1.02s vs coming down 1.02s) */}
      {followUp.timeline && (
        <div className="tl" style={{ marginTop: "12px" }}>
          <div style={{ width: "50%", background: followUp.timeline.leftColor }}>
            {followUp.timeline.leftLabel}
          </div>
          <div style={{ width: "50%", background: followUp.timeline.rightColor }}>
            {followUp.timeline.rightLabel}
          </div>
        </div>
      )}

      {/* Difference Tiles for WHAT-IF scenarios */}
      {followUp.diffTiles && followUp.diffTiles.length > 0 && (
        <div className="mini">
          {followUp.diffTiles.map((tile, idx) => (
            <div key={idx}>
              <small>{tile.label}</small>
              <b>{tile.value}</b>
              {tile.diff && <span className="chg">{tile.diff}</span>}
            </div>
          ))}
        </div>
      )}

      {/* WHAT-IF comparison chart */}
      {followUp.intent === "WHAT_IF" && <ComparisonTrajectoryChart />}

      {/* RE-EXPLAIN analogy diagrams */}
      {followUp.analogy && (
        <AnalogyChart
          leftTitle={followUp.analogy.leftTitle}
          leftDesc={followUp.analogy.leftDesc}
          rightTitle={followUp.analogy.rightTitle}
          rightDesc={followUp.analogy.rightDesc}
        />
      )}

      {/* Handwritten tip */}
      {followUp.handNote && (
        <div className="hand" style={{ fontFamily: "Caveat, cursive", fontSize: "21px", color: "var(--blue)", marginTop: "10px" }}>
          {followUp.handNote}
        </div>
      )}

      {/* Follow-up suggestions */}
      {followUp.followUps && followUp.followUps.length > 0 && (
        <div className="fups" style={{ marginTop: "12px" }}>
          {followUp.followUps.map((f, idx) => (
            <button key={idx} type="button" onClick={() => onFollowUpClick?.(f)}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

