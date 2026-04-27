import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
  size?: "sm" | "icon" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "default",
  size = "default",
  children,
  className = "",
  type: htmlType = "button",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    icon: "h-8 w-8 p-0",
  };

  const variantClasses = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    outline:
      "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-500",
    secondary:
      "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500",
    ghost: "text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-500",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    link: "text-blue-500 hover:underline focus:ring-blue-500",
  };

  return (
    <button
      type={htmlType}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
