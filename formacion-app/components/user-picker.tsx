"use client";

import { useMemo, useState } from "react";
import { searchUsers } from "@/lib/actions/requests";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Hit = { id: string; full_name: string; email: string; area: string | null };

export function UserPicker({
  defaultRequester,
}: {
  defaultRequester: Hit;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [selected, setSelected] = useState<Hit>(defaultRequester);

  const helper = useMemo(
    () => `${selected.full_name} · ${selected.email}`,
    [selected],
  );

  async function onSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    const results = await searchUsers(value);
    setHits(results as Hit[]);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="requester_search">Colaborador solicitante</Label>
      <input type="hidden" name="requester_id" value={selected.id} />
      <Input
        id="requester_search"
        value={query}
        placeholder="Buscar por nombre o correo (mín. 2 letras)"
        onChange={(event) => void onSearch(event.target.value)}
      />
      <p className="text-xs break-all text-muted-foreground">Seleccionado: {helper}</p>
      {hits.length > 0 ? (
        <ul className="divide-y rounded-lg border bg-background">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setSelected(hit);
                  setQuery("");
                  setHits([]);
                }}
              >
                <span className="font-medium">{hit.full_name}</span>
                <span className="text-xs break-all text-muted-foreground">
                  {hit.email}
                  {hit.area ? ` · ${hit.area}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
