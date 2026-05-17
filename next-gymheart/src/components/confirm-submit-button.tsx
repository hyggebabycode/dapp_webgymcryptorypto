"use client";

import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  children,
  className,
  message,
}: {
  children: ReactNode;
  className?: string;
  message: string;
}) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
