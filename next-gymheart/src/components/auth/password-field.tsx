"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type PasswordFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  inputClassName?: string;
  defaultValue?: string;
};

export function PasswordField({
  label,
  name,
  placeholder = "••••••••",
  autoComplete,
  minLength,
  required = true,
  inputClassName = "bg-[#fcf8f9]",
  defaultValue,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-black">{label}</label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input
          autoComplete={autoComplete}
          className={`h-14 w-full rounded-lg border border-pink-200 pl-12 pr-12 outline-none focus:border-primary ${inputClassName}`}
          minLength={minLength}
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}
