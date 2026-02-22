"use client";

import { styles } from "@/lib/avaxStyles";

interface CustomInputProps {
  label?: string;
  placeHolder: string;
  value: string;
  handleValueChange: (v: string) => void;
  /** If true, only allow alphanumeric (AvaxGods default). If false, allow any (e.g. wallet addresses) */
  alphanumericOnly?: boolean;
  id?: string;
  /** If true, input stretches to full width */
  fullWidth?: boolean;
}

const alphanumericRegex = /^[A-Za-z0-9]+$/;

export default function CustomInput({
  label,
  placeHolder,
  value,
  handleValueChange,
  alphanumericOnly = false,
  id = "custom-input",
  fullWidth = false,
}: CustomInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (alphanumericOnly && v !== "" && !alphanumericRegex.test(v)) return;
    handleValueChange(v);
  };

  return (
    <>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        placeholder={placeHolder}
        value={value}
        onChange={handleChange}
        className={`${styles.input} ${fullWidth ? "max-w-full w-full" : ""} focus:ring-2 focus:ring-siteViolet focus:outline-none`}
      />
    </>
  );
}
