"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone / installed mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);

    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "development") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (installing) {
              installing.addEventListener("statechange", () => {
                if (installing.state === "installed" && navigator.serviceWorker.controller) {
                  // New update available
                  console.info("Tardemah journal updated. Refresh to see changes.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }

    // Capture install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show banner if user has not previously dismissed it this session
      const dismissed = sessionStorage.getItem("tardemah-install-dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowInstallBanner(false);
    sessionStorage.setItem("tardemah-install-dismissed", "true");
  }

  if (isStandalone || !showInstallBanner || !deferredPrompt) {
    return null;
  }

  return (
    <aside className="pwa-install-banner" role="dialog" aria-label="Install Tardemah as an app">
      <div className="pwa-install-content">
        <div className="pwa-install-copy">
          <span className="pwa-install-title">Keep by your bedside</span>
          <span className="pwa-install-desc">Install Tardemah on your home screen for quick offline morning capture.</span>
        </div>
        <div className="pwa-install-actions">
          <button type="button" className="pwa-install-btn" onClick={handleInstall}>
            <Download size={14} /> Install
          </button>
          <button type="button" className="pwa-dismiss-btn" onClick={handleDismiss} aria-label="Dismiss banner">
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
