"use client";
import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: integrar com endpoint de newsletter quando existir
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-primary/10 border border-primary/25 px-4 py-3 text-sm text-primary">
        ✅ Pronto! A gente avisa quando tiver dica nova.
      </div>
    );
  }

  return (
    <form className="flex flex-col sm:flex-row gap-2" onSubmit={onSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="flex-1 bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/60"
      />
      <button
        type="submit"
        className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:opacity-90 whitespace-nowrap"
      >
        Inscrever
      </button>
    </form>
  );
}
