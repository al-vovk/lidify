import { ReactNode } from "react";

interface SettingsRowProps {
    label: string;
    description?: ReactNode;
    children: ReactNode;
    htmlFor?: string;
}

export function SettingsRow({ label, description, children, htmlFor }: SettingsRowProps) {
    return (
        <div className="flex items-center justify-between py-3 min-h-[56px]">
            <div className="flex-1 pr-4">
                <label 
                    htmlFor={htmlFor}
                    className="text-sm text-white cursor-pointer"
                >
                    {label}
                </label>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
            </div>
            <div className="shrink-0">
                {children}
            </div>
        </div>
    );
}

