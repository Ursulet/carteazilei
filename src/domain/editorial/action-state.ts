export type PublishingGateItem = {
  key: string;
  label: string;
  passed: boolean;
};

export type EditorialActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  gate?: PublishingGateItem[];
  submittedValues?: Record<string, string | string[]>;
};

export const initialEditorialActionState: EditorialActionState = {
  status: "idle",
};

export class EditorialServiceError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
    public readonly gate?: PublishingGateItem[],
  ) {
    super(message);
    this.name = "EditorialServiceError";
  }
}

function snapshotFormData(formData?: FormData) {
  if (!formData) return undefined;
  const snapshot: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const current = snapshot[key];
    if (current === undefined) snapshot[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else snapshot[key] = [current, value];
  }
  return snapshot;
}

export function toActionState(error: unknown, formData?: FormData): EditorialActionState {
  const submittedValues = snapshotFormData(formData);
  if (error instanceof EditorialServiceError) {
    return {
      status: "error",
      message: error.message,
      fieldErrors: error.fieldErrors,
      gate: error.gate,
      submittedValues,
    };
  }

  console.error(error);
  return {
    status: "error",
    submittedValues,
    message: "Operațiunea nu a putut fi finalizată. Încearcă din nou.",
  };
}
