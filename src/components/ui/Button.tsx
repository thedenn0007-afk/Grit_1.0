import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function Button({ children, className, ...rest }: ButtonProps): JSX.Element {
  return (
    <button
      className={["px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
