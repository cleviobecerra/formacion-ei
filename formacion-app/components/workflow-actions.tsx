"use client";

import { useState } from "react";
import { transitionRequest } from "@/lib/actions/requests";
import type { RequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function WorkflowActions({
  requestId,
  actions,
}: {
  requestId: string;
  actions: { status: RequestStatus; label: string; variant?: "default" | "destructive" | "outline"; needsComment?: boolean }[];
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      {actions.some((action) => action.needsComment) ? (
        <div className="space-y-2">
          <Label htmlFor="workflow_comment">Comentario / motivo</Label>
          <Textarea
            id="workflow_comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {actions.map((action) => (
          <Button
            key={action.status + action.label}
            className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
            variant={action.variant ?? "default"}
            disabled={busy === action.label}
            onClick={async () => {
              setBusy(action.label);
              const result = await transitionRequest(
                requestId,
                action.status,
                action.needsComment ? comment : undefined,
              );
              setError(result.error);
              setBusy(null);
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
