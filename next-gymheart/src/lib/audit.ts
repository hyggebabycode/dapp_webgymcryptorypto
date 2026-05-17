import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditLogInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

function isMissingAuditTable(error: unknown) {
  const maybeError = error as { message?: string; details?: string; hint?: string };
  return [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("audit_logs");
}

export async function writeAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  details = {},
}: AuditLogInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: actorUserId || null,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details,
  });

  if (error && !isMissingAuditTable(error)) {
    console.error("Failed to write audit log", error);
  }
}
