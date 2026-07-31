export type BookImportReportItem = {
  row: number;
  identifier: string;
  title: string;
  message: string;
  bookId?: string;
};

export type BookImportActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  imported: BookImportReportItem[];
  skipped: BookImportReportItem[];
  errors: BookImportReportItem[];
  covers?: Array<{ identifier: string; altText: string }>;
};

export const initialBookImportActionState: BookImportActionState = {
  status: "idle",
  imported: [],
  skipped: [],
  errors: [],
};
