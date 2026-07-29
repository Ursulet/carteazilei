"use client";

export function ConfirmDeleteForm({ action, label = "Șterge", message = "Confirmi ștergerea? Elementul va fi scos din fluxurile active." }: { action: (formData: FormData) => void | Promise<void>; label?: string; message?: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>
      <button type="submit" className="min-h-11 rounded-full border border-danger px-5 text-sm font-bold text-danger transition hover:bg-danger hover:text-white">{label}</button>
    </form>
  );
}
