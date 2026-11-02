import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Prefs } from "@/lib/astra/prefs";
export type VisitStage = "setup" | "login" | "account-setup" | "ready";
export type VisitEvent = "choices-complete" | "account-confirmed" | "setup-needed" | "restart";
export function initialVisitStage(path = "/", navigationType = "navigate"): VisitStage {
  return path !== "/" && path !== "/index" || navigationType === "reload" ? "ready" : "setup";
}
export function nextVisitStage(stage: VisitStage, event: VisitEvent): VisitStage {
  if (event === "restart") return "setup";
  if (stage === "setup" && event === "choices-complete") return "login";
  if (stage === "login" && event === "account-confirmed") return "ready";
  if (stage === "login" && event === "setup-needed") return "account-setup";
  if (stage === "account-setup" && event === "account-confirmed") return "ready";
  return stage;
}
export function visitDestination(p: Pick<Prefs,"console"|"focus"> & Partial<Pick<Prefs,"layout">>): "/desktop"|"/console"|"/console/media"|"/home"|"/games"|"/movies"|"/music"|"/web"|"/chat" {
  if (p.console === "off" && p.layout === "windows") return "/desktop";
  if (p.console === "off" && p.layout === "switch") return "/home";
  if (p.console !== "off") return ["music","movies","ai","web"].includes(p.focus) ? "/console/media" : "/console";
  return ({games:"/games",movies:"/movies",music:"/music",web:"/web",ai:"/chat",all:"/home","":"/home"} as const)[p.focus];
}
const VisitContext = createContext({stage: "setup" as VisitStage, send: (_event: VisitEvent) => {}});
export function VisitProvider({children}:{children:ReactNode}) {
  const [stage,setStage]=useState<VisitStage>("setup");
  useEffect(() => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    setStage(initialVisitStage(window.location.pathname, entry?.type));
  }, []);
  return <VisitContext.Provider value={{stage,send:event=>setStage(s=>nextVisitStage(s,event))}}>{children}</VisitContext.Provider>;
}
export const useVisit=()=>useContext(VisitContext);
