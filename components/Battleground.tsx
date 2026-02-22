"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { battlegrounds } from "@/lib/avaxAssets";
import { Alert } from "@/components/avax";
import { styles } from "@/lib/avaxStyles";

export default function Battleground() {
  const router = useRouter();
  const [alert, setAlert] = useState<{
    status: boolean;
    type: "info" | "success" | "failure";
    message: string;
  } | null>(null);

  const handleBattleChoice = (ground: (typeof battlegrounds)[0]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("battleground", ground.id);
    }
    setAlert({
      status: true,
      type: "info",
      message: `${ground.name} is battle ready!`,
    });
    setTimeout(() => {
      setAlert(null);
      router.back();
    }, 1000);
  };

  return (
    <div
      className={`${styles.flexCenter} ${styles.battlegroundContainer} min-h-[calc(100dvh-3.5rem)] flex-col overflow-x-hidden`}
    >
      {alert?.status && (
        <Alert type={alert.type} message={alert.message} />
      )}

      <h1 className={`${styles.headText} text-center`}>
        Choose your <span className="text-siteViolet">Battle</span> Ground
      </h1>

      <div className={`${styles.flexCenter} ${styles.battleGroundsWrapper}`}>
        {battlegrounds.map((ground) => (
          <div
            key={ground.id}
            className={`${styles.flexCenter} ${styles.battleGroundCard}`}
            onClick={() => handleBattleChoice(ground)}
          >
            <Image
              src={ground.image}
              alt={ground.name}
              width={420}
              height={260}
              className={styles.battleGroundCardImg}
            />
            <div className="info absolute">
              <p className={styles.battleGroundCardText}>{ground.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
