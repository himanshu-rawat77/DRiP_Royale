"use client";

import { styles } from "@/lib/avaxStyles";

interface CustomButtonProps {
  title: string;
  handleClick: () => void;
  restStyles?: string;
  disabled?: boolean;
}

export default function CustomButton({
  title,
  handleClick,
  restStyles = "",
  disabled = false,
}: CustomButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${restStyles} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {title}
    </button>
  );
}
