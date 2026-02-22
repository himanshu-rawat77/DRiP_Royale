"use client";

import { styles } from "@/lib/avaxStyles";
import AlertIcon from "./AlertIcon";

type AlertType = "info" | "success" | "failure";

interface AlertProps {
  type: AlertType;
  message: string;
}

export default function Alert({ type, message }: AlertProps) {
  return (
    <div className={`${styles.alertContainer} ${styles.flexCenter}`}>
      <div className={`${styles.alertWrapper} ${styles[type]}`} role="alert">
        <AlertIcon type={type} /> {message}
      </div>
    </div>
  );
}
