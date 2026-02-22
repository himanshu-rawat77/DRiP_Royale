"use client";

import { useState } from "react";
import { gameRules } from "@/lib/avaxAssets";
import { styles } from "@/lib/avaxStyles";

export default function GameInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed right-4 top-24 z-30">
        <button
          type="button"
          className={styles.gameInfoIcon}
          onClick={() => setIsOpen(true)}
          title="Game rules"
        >
          <span className="text-white font-rajdhani text-sm font-bold">?</span>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed right-0 top-0 h-screen w-80 max-w-full bg-siteDimBlack border-l border-white/20 z-50 flex flex-col p-6"
        >
          <div className="flex flex-col w-full">
            <div className={styles.gameInfoSidebarCloseBox}>
              <button
                type="button"
                className={styles.gameInfoSidebarClose}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <h2 className={styles.gameInfoHeading}>Game Rules</h2>
            <ul className="space-y-3 mt-4">
              {gameRules.map((rule, i) => (
                <li key={i} className={styles.gameInfoText}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
