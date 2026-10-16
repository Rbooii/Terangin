"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { TrashIcon } from "@/components/landing/icons";
import { deleteAccountAction, type DeleteAccountState } from "@/lib/actions/account";

export default function DeleteAccountCard() {
  const reduceMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, pending] = useActionState<
    DeleteAccountState,
    FormData
  >(deleteAccountAction, undefined);

  const ready = password.length > 0 && confirmation === "HAPUS" && !pending;

  return (
    <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 sm:p-7">
      <h2 className="text-[15px] font-medium text-fg">Hapus akun</h2>
      <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-fg-muted">
        Menghapus akun berarti seluruh datamu di Terang.in ikut terhapus
        permanen: profil, jawaban asesmen, nilai rapor, hasil analisis, riwayat
        chat, dan riwayat transaksi. Tindakan ini tidak bisa dibatalkan.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 flex h-10 items-center gap-2 rounded-full border border-danger/30 px-5 text-[13px] text-danger transition-colors hover:bg-danger/10"
        >
          <TrashIcon className="size-4" />
          Hapus akun
        </button>
      ) : (
        <motion.form
          action={formAction}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          className="mt-5 space-y-3"
        >
            <div>
              <label
                htmlFor="delete-password"
                className="text-[12px] font-medium text-fg-muted"
              >
                Password kamu
              </label>
              <input
                id="delete-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-overlay/10 bg-overlay/4 px-4 text-sm text-fg outline-none transition-colors placeholder:text-fg-faintest focus:border-overlay/25 focus:bg-overlay/6"
                placeholder="Masukkan password"
              />
            </div>
            <div>
              <label
                htmlFor="delete-confirmation"
                className="text-[12px] font-medium text-fg-muted"
              >
                Ketik HAPUS untuk konfirmasi
              </label>
              <input
                id="delete-confirmation"
                name="confirmation"
                type="text"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-overlay/10 bg-overlay/4 px-4 text-sm text-fg outline-none transition-colors placeholder:text-fg-faintest focus:border-overlay/25 focus:bg-overlay/6"
                placeholder="HAPUS"
                autoComplete="off"
              />
            </div>

            {state?.error && (
              <p className="text-[12px] text-danger">{state.error}</p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={!ready}
                className="flex h-10 items-center gap-2 rounded-full bg-danger px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <TrashIcon className="size-4" />
                {pending ? "Menghapus..." : "Hapus akun permanen"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="h-10 rounded-full border border-overlay/10 px-5 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          <p className="text-[11px] text-fg-faintest">
            Tombol aktif setelah password terisi dan kamu mengetik HAPUS.
          </p>
        </motion.form>
      )}
    </div>
  );
}
