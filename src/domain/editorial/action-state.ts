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

export function toActionState(error: unknown): EditorialActionState {
  if (error instanceof EditorialServiceError) {
    return {
      status: "error",
      message: error.message,
      fieldErrors: error.fieldErrors,
      gate: error.gate,
    };
  }

  console.error(error);
  return {
    status: "error",
    message: "Operațiunea nu a putut fi finalizată. Încearcă din nou.",
  };
}
