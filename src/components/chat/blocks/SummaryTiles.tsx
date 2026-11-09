"use client";

import React, { useEffect, useState } from "react";
import { ResultTile } from "@/lib/chat/schema";

export function SummaryTiles({ tiles }: { tiles: ResultTile[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="tldr rv in">
      <div className="lab">The answer</div>
      <div className="tiles">
        {tiles.map((tile, i) => (
          <div className="tile" key={i}>
            <small>{tile.label}</small>
            <b>
              <span>{tile.value}</span>
              {tile.unit && <em>{tile.unit}</em>}
            </b>
            {tile.formula && <div className="f">{tile.formula}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

