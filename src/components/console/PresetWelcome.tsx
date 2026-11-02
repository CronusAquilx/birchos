import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppearancePresets } from "@/components/astra/AppearancePresets";
import { PersonalizationSetup } from "./PersonalizationSetup";
import { activeLayout } from "@/lib/astra/appearance";
import { usePrefs, setAppearance, saveAppearancePreset, flushPreferences } from "@/lib/astra/prefs";
import logo from "@/assets/birch-os-logo.png.asset.json";
import { toast } from "sonner";

export function PresetWelcome({ onDone }: { onDone: () => void }) {
  const p = usePrefs(); const [create, setCreate] = useState(false); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  if (create) return <div className="bg-background"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 pt-4"><Input aria-label="New preset name" placeholder="Preset name" value={name} maxLength={60} onChange={e => setName(e.target.value)}/></div><PersonalizationSetup busy={busy} onBack={() => setCreate(false)} onConfirm={look => { setBusy(true); setAppearance(activeLayout(p), look); saveAppearancePreset(name || "My look"); void flushPreferences().then(onDone).catch(e => { toast.error(e.message); setBusy(false); }); }}/></div>;
  return <main className="h-dvh overflow-y-auto bg-background text-foreground"><div className="mx-auto max-w-4xl px-5 py-10"><img src={logo.url} alt="BIRCH OS" className="mb-8 w-64 rounded-lg"/><h1 className="text-3xl font-medium">Your space, your look.</h1><p className="mt-3 text-muted-foreground">Would you like to select a personalization preset or make a new one?</p><AppearancePresets onSelect={() => { void flushPreferences().then(onDone).catch(e => toast.error(e.message)); }} onNew={() => setCreate(true)}/><Button className="mt-6" variant="ghost" onClick={onDone}>Continue with current look</Button></div></main>;
}