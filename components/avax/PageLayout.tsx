"use client";

import Link from "next/link";
import Image from "next/image";
import { styles } from "@/lib/avaxStyles";
import { heroImg as defaultHeroImg, logo } from "@/lib/avaxAssets";
import Alert from "./Alert";

type AlertType = "info" | "success" | "failure";

interface PageLayoutProps {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
  /** Optional alert to show */
  alert?: { status: boolean; type: AlertType; message: string } | null;
  /** Hero image path - uses gradient fallback if not provided */
  heroImg?: string;
}

export default function PageLayout({
  title,
  description,
  children,
  alert,
  heroImg,
}: PageLayoutProps) {
  const heroSrc = heroImg ?? defaultHeroImg;
  return (
    <div className={styles.hocContainer}>
      {alert?.status && (
        <Alert type={alert.type} message={alert.message} />
      )}

      <div className={styles.hocContentBox}>
        <Link href="/" className="block">
          {/* <Image
            src={logo}
            alt="DRiP Royale"
            width={160}
            height={52}
            className={styles.hocLogo}
          /> */}
        </Link>

        <div className={styles.hocBodyWrapper}>
          <div className="flex flex-row w-full">
            <h1 className={`flex ${styles.headText} head-text`}>{title}</h1>
          </div>

          <p className={`${styles.normalText} my-10`}>{description}</p>

          {children}
        </div>

        <div className="flex flex-wrap gap-6 items-center mt-6">
          <Link href="/" className={styles.footerText}>
            Home
          </Link>
          <Link href="/vault" className={styles.footerText}>
            Vault
          </Link>
          <Link href="/arena" className={styles.footerText}>
            Arena
          </Link>
          <Link href="/ledger" className={styles.footerText}>
            Ledger
          </Link>
          {/* <Link href="/battleground" className={styles.footerText}>
            Battleground
          </Link> */}
          <span className={styles.footerText}>Made with 💜 for DRiP Royale</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-[400px]">
        {heroSrc ? (
          <div
            className="w-full xl:min-h-screen bg-cover bg-no-repeat bg-center"
            style={{ backgroundImage: `url(${heroSrc})` }}
          />
        ) : (
          <div
            className="w-full xl:min-h-screen bg-cover bg-no-repeat bg-center"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #131519 100%)",
              backgroundSize: "cover",
            }}
          />
        )}
      </div>
    </div>
  );
}
