"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "terangin-cookie-consent";
const CONSENT_EVENT = "terangin:consent-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function hasNoConsent() {
  return window.localStorage.getItem(STORAGE_KEY) === null;
}

function getServerSnapshot() {
  return false;
}

export default function CookieBanner() {
  const visible = useSyncExternalStore(
    subscribe,
    hasNoConsent,
    getServerSnapshot,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [optionalCookies, setOptionalCookies] = useState(true);

  function decide(value: string) {
    window.localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-overlay/10 bg-surface-elevated p-4 shadow-2xl">
      <p className="text-[11px] leading-relaxed text-fg-muted">
        Essential cookies keep the site working and stay on. Optional cookies
        help with performance and advertising. Accept, reject, or manage
        them. Learn more in our{" "}
        <a href="#" className="text-fg-secondary underline underline-offset-2 hover:text-fg">
          Cookie Policy
        </a>
        ,{" "}
        <a href="#" className="text-fg-secondary underline underline-offset-2 hover:text-fg">
          Privacy Policy
        </a>
        , and{" "}
        <a href="#" className="text-fg-secondary underline underline-offset-2 hover:text-fg">
          Terms of Service
        </a>
        .
      </p>

      {showSettings && (
        <div className="mt-3 space-y-3 rounded-lg border border-overlay/8 bg-sunken p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium text-fg-soft">
                Essential
              </p>
              <p className="text-[10px] text-fg-faint">
                Selalu aktif biar situs tetap jalan.
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-fg-faint">
              Always on
            </span>
          </div>
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="block text-[11px] font-medium text-fg-soft">
                Optional
              </span>
              <span className="block text-[10px] text-fg-faint">
                Performance & advertising.
              </span>
            </span>
            <input
              type="checkbox"
              checked={optionalCookies}
              onChange={(e) => setOptionalCookies(e.target.checked)}
              className="mt-0.5 size-3.5 shrink-0 accent-white"
            />
          </label>
          <button
            type="button"
            onClick={() => decide(optionalCookies ? "custom-accept" : "custom-reject")}
            className="h-7 w-full rounded-full bg-primary text-[11px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
          >
            Save Preferences
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="h-7 rounded-full border border-overlay/10 px-3 text-[11px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
        >
          Cookies Settings
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          className="h-7 rounded-full border border-overlay/10 px-3 text-[11px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
        >
          Reject All
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          className="h-7 rounded-full bg-primary px-3 text-[11px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
        >
          Accept All Cookies
        </button>
      </div>
    </div>
  );
}
