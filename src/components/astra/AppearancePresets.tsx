import { useState } from "react";
import { Plus, Trash2, Check, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrefs, setPrefs, saveAppearancePreset, applyAppearancePreset } from "@/lib/astra/prefs";
import { AppearancePreview } from "./AppearancePreview";
import { activeLayout } from "@/lib/astra/appearance";

export function AppearancePresets({ onSelect, onNew }: { onSelect?: () => void; onNew?: () => void }) {
  const p = usePrefs(); const [name, setName] = useState("");
  return <section className="border-b border-border py-5">
    <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-medium"><Bookmark className="size-4"/>Your presets</h2>{onNew && <Button variant="secondary" onClick={onNew}><Plus/>New look</Button>}</div>
    {!onSelect && <form className="mb-5 flex gap-2" onSubmit={e => { e.preventDefault(); saveAppearancePreset(name); setName(""); }}><Input aria-label="Preset name" placeholder="Name this look" maxLength={60} value={name} onChange={e => setName(e.target.value)}/><Button variant="secondary" disabled={!name.trim()} type="submit"><Plus/>Save preset</Button></form>}
    <div className="grid gap-4 sm:grid-cols-2">{(p.appearancePresets ?? []).map(preset => <article key={preset.id} className="min-w-0 overflow-hidden rounded-lg border border-border"><AppearancePreview layout={activeLayout(p)} look={preset.look}/><div className="flex items-center justify-between gap-2 p-3"><span className="truncate text-sm font-medium">{preset.name}</span><div className="flex shrink-0 gap-1"><Button variant="secondary" size="icon" title={`Use ${preset.name}`} aria-label={`Use ${preset.name}`} onClick={() => { applyAppearancePreset(preset); onSelect?.(); }}><Check/></Button><Button variant="ghost" size="icon" title="Delete preset" aria-label={`Delete ${preset.name}`} onClick={() => setPrefs({ appearancePresets: p.appearancePresets.filter(item => item.id !== preset.id) })}><Trash2/></Button></div></div></article>)}</div>
    {!p.appearancePresets?.length && <p className="py-4 text-sm text-muted-foreground">No saved presets yet.</p>}
  </section>;
}