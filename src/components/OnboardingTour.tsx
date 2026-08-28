import { useState, useEffect } from "react";
import { Joyride, STATUS, EVENTS } from "react-joyride";
import type { Step, EventData, TooltipRenderProps } from "react-joyride";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export type { Step };

export interface OnboardingTourProps {
  tourKey: string;
  steps: Step[];
  buttonClassName?: string;
  buttonLabel?: string;
}

function CustomTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      style={{
        backgroundColor: "#ffffff",
        color: "#0f172a",
        borderRadius: "1.25rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        padding: "1.25rem",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        boxSizing: "border-box",
      }}
      className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-100 max-w-[380px] w-full font-sans outline-none"
    >
      {/* Title */}
      {step.title && (
        <h3
          style={{
            color: "#0f172a",
            fontSize: "1.05rem",
            fontWeight: 700,
            marginBottom: "0.4rem",
            marginTop: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          className="text-base font-bold text-slate-900 mb-1.5 flex items-center justify-between"
        >
          <span>{step.title}</span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#16a34a",
              backgroundColor: "#f0fdf4",
              padding: "0.15rem 0.5rem",
              borderRadius: "9999px",
            }}
          >
            {index + 1} / {size}
          </span>
        </h3>
      )}

      {/* Content / Description */}
      <div
        style={{
          color: "#334155",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          padding: "0.25rem 0 0.5rem 0",
        }}
        className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3"
      >
        {step.content}
      </div>

      {/* Footer / Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "0.75rem",
          borderTop: "1px solid #f1f5f9",
          marginTop: "0.5rem",
        }}
        className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2"
      >
        {/* Skip button */}
        {!isLastStep ? (
          <button
            {...skipProps}
            type="button"
            style={{
              color: "#94a3b8",
              fontSize: "0.8125rem",
              fontWeight: 500,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {skipProps.title || "Skip"}
          </button>
        ) : (
          <div />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="flex items-center gap-2">
          {/* Back button */}
          {index > 0 && (
            <button
              {...backProps}
              type="button"
              style={{
                color: "#64748b",
                fontSize: "0.8125rem",
                fontWeight: 600,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                marginRight: "0.25rem",
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {backProps.title || "Back"}
            </button>
          )}

          {/* Primary / Next / Finish button */}
          <button
            {...primaryProps}
            type="button"
            style={{
              backgroundColor: "#16a34a",
              color: "#ffffff",
              borderRadius: "0.75rem",
              fontWeight: 600,
              fontSize: "0.8125rem",
              padding: "0.5rem 1rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
            }}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {primaryProps.title || (isLastStep ? "Finish" : "Next")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour({
  tourKey,
  steps,
  buttonClassName,
  buttonLabel,
}: OnboardingTourProps) {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);

  const displayButtonLabel = buttonLabel || t("tour.takeTour", { defaultValue: "Take a Tour" });

  useEffect(() => {
    // Auto start on first visit if not yet completed or skipped
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(tourKey);
    if (!seen && steps && steps.length > 0) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tourKey, steps]);

  const handleJoyrideEvent = (data: EventData) => {
    const { status, type, action } = data;

    // Handle user completing or explicitly skipping the tour
    if (type === EVENTS.TOUR_END || type === EVENTS.TOUR_STATUS) {
      if (status === STATUS.FINISHED) {
        if (typeof window !== "undefined") localStorage.setItem(tourKey, "true");
        setRun(false);
      } else if (status === STATUS.SKIPPED && action === "skip") {
        if (typeof window !== "undefined") localStorage.setItem(tourKey, "true");
        setRun(false);
      }
    }

    // Target not found warning - do NOT lock localstorage so user can replay anytime
    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Just ignore quietly while joyride polls for the element within targetWaitTimeout
    }
  };

  const handleManualStart = () => {
    setRun(true);
  };

  if (!steps || steps.length === 0) return null;

  return (
    <>
      {/* Persistent manual trigger button */}
      <button
        type="button"
        onClick={handleManualStart}
        title={displayButtonLabel}
        className={
          buttonClassName ||
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        }
      >
        <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{displayButtonLabel}</span>
      </button>

      <Joyride
        steps={steps}
        run={run}
        continuous
        scrollToFirstStep
        tooltipComponent={CustomTooltip}
        options={{
          buttons: ["skip", "back", "primary"],
          skipBeacon: true,
          showProgress: true,
          primaryColor: "#16a34a",
          textColor: "#0f172a",
          backgroundColor: "#ffffff",
          arrowColor: "#ffffff",
          overlayColor: "rgba(15, 23, 42, 0.65)", // Premium dark glass overlay
          targetWaitTimeout: 5000,
          scrollOffset: 160,
          spotlightPadding: 8,
          spotlightRadius: 16,
        }}
        locale={{
          back: t("tour.back", { defaultValue: "Back" }),
          close: t("tour.skip", { defaultValue: "Skip" }),
          last: t("tour.last", { defaultValue: "Finish" }),
          next: t("tour.next", { defaultValue: "Next" }),
          skip: t("tour.skip", { defaultValue: "Skip" }),
        }}
        onEvent={handleJoyrideEvent}
        styles={{
          tooltip: {
            backgroundColor: "#ffffff",
            color: "#0f172a",
            borderRadius: "1.25rem",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            padding: "1.25rem",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            zIndex: 10000,
          },
          tooltipContainer: {
            textAlign: "left" as const,
            backgroundColor: "#ffffff",
            color: "#0f172a",
          },
          tooltipTitle: {
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "0.35rem",
          },
          tooltipContent: {
            fontSize: "0.875rem",
            color: "#334155",
            lineHeight: 1.5,
            padding: "0.25rem 0",
          },
          arrow: {
            color: "#ffffff",
          },
          buttonPrimary: {
            backgroundColor: "#16a34a",
            borderRadius: "0.75rem",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.8125rem",
            padding: "0.5rem 1rem",
            outline: "none",
            boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
          },
          buttonBack: {
            color: "#64748b",
            marginRight: "0.5rem",
            fontWeight: 600,
            fontSize: "0.8125rem",
          },
          buttonSkip: {
            color: "#94a3b8",
            fontSize: "0.8125rem",
            fontWeight: 500,
          },
          overlay: {
            zIndex: 9999,
          },
        }}
      />
    </>
  );
}
