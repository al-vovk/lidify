"use client";

import { useState, useEffect, useCallback } from "react";

const ACTIVITY_PANEL_KEY = "lidify_activity_panel_open";

export function useActivityPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"notifications" | "active" | "history">("notifications");
    const [isInitialized, setIsInitialized] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(ACTIVITY_PANEL_KEY);
            if (stored === "true") {
                setIsOpen(true);
            }
            setIsInitialized(true);
        }
    }, []);

    // Persist state to localStorage
    useEffect(() => {
        if (isInitialized && typeof window !== "undefined") {
            localStorage.setItem(ACTIVITY_PANEL_KEY, isOpen ? "true" : "false");
        }
    }, [isOpen, isInitialized]);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    return {
        isOpen,
        activeTab,
        setActiveTab,
        toggle,
        open,
        close,
        isInitialized,
    };
}
