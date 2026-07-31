export type AuthorImportReportItem = {
  row: number;
  identifier: string;
  name: string;
  message: string;
  authorId?: string;
};

export type AuthorImportActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  imported: AuthorImportReportItem[];
  skipped: AuthorImportReportItem[];
  errors: AuthorImportReportItem[];
};

export const initialAuthorImportActionState: AuthorImportActionState = {
  status: "idle",
  imported: [],
  skipped: [],
  errors: [],
};
