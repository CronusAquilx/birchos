import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useHydrated } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useVisit } from "@/lib/console/visit";
import { ConsoleOnboarding } from "./ConsoleOnboarding";
import { AuthPage } from "@/components/astra/AuthPage";
import { PresetWelcome } from "./PresetWelcome";
export function VisitGate({children}:{children:ReactNode}) {
 const {loading}=useAuth();
 const hydrated=useHydrated();const {stage}=useVisit();const {pathname}=useLocation();
 const [presetEntry,setPresetEntry]=useState(false);
 useEffect(() => { const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined; setPresetEntry((window.location.pathname === "/" || window.location.pathname === "/index") && entry?.type !== "reload"); }, []);
 // Standalone games and proxied pages never mount the app's welcome/login flow.
 if(pathname==="/play"||pathname==="/guest-play"||pathname.startsWith("/scramjet/"))return <>{children}</>;
 if(!hydrated||loading)return <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">BirchBlock</div>;
 if(stage==="setup")return <ConsoleOnboarding/>;
 if(stage==="login")return <AuthPage/>;
 if(stage==="account-setup")return <ConsoleOnboarding accountSetup/>;
 if(stage==="ready"&&presetEntry)return <PresetWelcome onDone={()=>setPresetEntry(false)}/>;
 return <>{children}</>;
}
