"use client";

const Field = ({ label, hint, children }) => (
  <div>
    <label className="text-xs text-ink-400 uppercase tracking-wider">{label}</label>
    {children}
    {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
  </div>
);

const Input = (props) => (
  <input {...props} className="mt-1 w-full bg-bg/60 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-sm" />
);

const Textarea = (props) => (
  <textarea {...props} className="mt-1 w-full bg-bg/60 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-sm" />
);

const Select = (props) => (
  <select {...props} className="mt-1 w-full bg-bg/60 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-sm" />
);

export default function ConfigPanel({ node, onChange, onDelete }) {
  if (!node) return (
    <div className="p-6 text-center text-ink-400 text-sm">
      Selecione um bloco no canvas para configurá-lo.
    </div>
  );

  const set = (patch) => onChange({ ...node, data: { ...node.data, ...patch } });
  const d = node.data;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">Configurar {node.type}</h3>
        {node.type !== "trigger" && (
          <button onClick={onDelete} className="text-xs text-red-400 hover:underline">
            Excluir bloco
          </button>
        )}
      </div>

      {node.type === "trigger" && (
        <Field label="Palavras-chave (opcional)" hint="Vazio = qualquer mensagem do cliente dispara o fluxo">
          <Input
            value={(d.keywords || []).join(", ")}
            onChange={(e) => set({ keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="oi, olá, promo"
          />
        </Field>
      )}

      {node.type === "message" && (
        <>
          <Field label="Tipo">
            <Select value={d.kind || "text"} onChange={(e) => set({ kind: e.target.value })}>
              <option value="text">Texto</option>
              <option value="image">Imagem (URL)</option>
              <option value="audio">Áudio (URL)</option>
              <option value="document">Documento (URL)</option>
            </Select>
          </Field>
          {d.kind && d.kind !== "text" && (
            <Field label="URL do arquivo">
              <Input value={d.url || ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://..." />
            </Field>
          )}
          <Field label={d.kind && d.kind !== "text" ? "Legenda (opcional)" : "Texto"} hint="Use {nome} pra personalizar">
            <Textarea rows={4} value={d.text || ""} onChange={(e) => set({ text: e.target.value })} placeholder="Olá {nome}, ..." />
          </Field>
          <Field label="Delay antes de enviar (segundos)">
            <Input type="number" min={0} value={d.delay || 0} onChange={(e) => set({ delay: parseInt(e.target.value) || 0 })} />
          </Field>
        </>
      )}

      {node.type === "delay" && (
        <>
          <Field label="Duração">
            <Input type="number" min={1} value={d.value || 5} onChange={(e) => set({ value: parseInt(e.target.value) || 1 })} />
          </Field>
          <Field label="Unidade">
            <Select value={d.unit || "s"} onChange={(e) => set({ unit: e.target.value })}>
              <option value="s">Segundos</option>
              <option value="m">Minutos</option>
              <option value="h">Horas</option>
            </Select>
          </Field>
        </>
      )}

      {node.type === "condition" && (
        <>
          <Field label="Operador">
            <Select value={d.op || "contains"} onChange={(e) => set({ op: e.target.value })}>
              <option value="contains">Contém</option>
              <option value="equals">É igual a</option>
            </Select>
          </Field>
          <Field label="Valor a comparar" hint="Compara com a resposta do cliente (case-insensitive)">
            <Input value={d.value || ""} onChange={(e) => set({ value: e.target.value })} placeholder="sim" />
          </Field>
        </>
      )}

      {node.type === "action" && (
        <>
          <Field label="Tipo de ação">
            <Select value={d.kind || "end"} onChange={(e) => set({ kind: e.target.value })}>
              <option value="add_tag">Adicionar tag ao contato</option>
              <option value="end">Finalizar fluxo</option>
              <option value="redirect">Ir pra outro fluxo</option>
            </Select>
          </Field>
          {(d.kind === "add_tag" || d.kind === "redirect") && (
            <Field label={d.kind === "add_tag" ? "Tag" : "ID do fluxo destino"}>
              <Input value={d.value || ""} onChange={(e) => set({ value: e.target.value })} />
            </Field>
          )}
        </>
      )}
    </div>
  );
}
