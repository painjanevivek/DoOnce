"use client";

import type { WorkflowInputDefinition, WorkflowSpec } from "../../../contracts/protocol";
import type { ContractIssue } from "../../../contracts/validation";
import { addWorkflowInput } from "./editor-model";
import { EditorField } from "./workflow-step-editor";

export function WorkflowInputEditor({ spec, issues, onChange }: { spec: WorkflowSpec; issues: ContractIssue[]; onChange(spec: WorkflowSpec): void }) {
  function update(index: number, input: WorkflowInputDefinition) {
    onChange({ ...spec, inputs: spec.inputs.map((item, itemIndex) => itemIndex === index ? input : item) });
  }
  return (
    <section className="studio-section" aria-labelledby="inputs-title">
      <div className="studio-section__heading">
        <div><p className="eyebrow">Reusable values</p><h2 id="inputs-title">Inputs</h2><p>Values marked secret are never shown in previews and cannot store a default.</p></div>
        <button className="secondary-button" disabled={spec.inputs.length >= 20} onClick={() => onChange(addWorkflowInput(spec))} type="button">Add input</button>
      </div>
      {spec.inputs.length === 0 ? <div className="studio-empty"><strong>No inputs yet</strong><p>Add one when a step should receive a value at run time.</p></div> : (
        <div className="input-cards">{spec.inputs.map((input, index) => (
          <article className="input-card" key={`${input.name}-${index}`}>
            <div className="input-card__heading"><strong>{input.label || `Input ${index + 1}`}</strong><button onClick={() => onChange({ ...spec, inputs: spec.inputs.filter((_, itemIndex) => itemIndex !== index) })} type="button">Remove</button></div>
            <div className="editor-grid editor-grid--four">
              <EditorField label="Internal name" error={issueAt(issues, `/inputs/${index}/name`)}><input value={input.name} onChange={(event) => update(index, { ...input, name: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} /></EditorField>
              <EditorField label="Label" error={issueAt(issues, `/inputs/${index}/label`)}><input maxLength={120} value={input.label} onChange={(event) => update(index, { ...input, label: event.target.value })} /></EditorField>
              <EditorField label="Type"><select value={input.kind} onChange={(event) => { const kind = event.target.value as WorkflowInputDefinition["kind"]; update(index, kind === "select" ? { ...input, kind, options: input.options ?? ["Option 1"] } : stripOptions({ ...input, kind })); }}><option value="text">Text</option><option value="date">Date</option><option value="select">Choice list</option></select></EditorField>
              <EditorField label="Default value" error={issueAt(issues, `/inputs/${index}/defaultValue`)}><input disabled={input.secret} type={input.secret ? "password" : input.kind === "date" ? "date" : "text"} value={input.defaultValue ?? ""} onChange={(event) => update(index, event.target.value ? { ...input, defaultValue: event.target.value } : withoutDefault(input))} /></EditorField>
            </div>
            {input.kind === "select" && <EditorField label="Options (one per line)"><textarea value={(input.options ?? []).join("\n")} onChange={(event) => update(index, { ...input, options: event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).slice(0, 100) })} /></EditorField>}
            <div className="input-flags"><label><input checked={input.required} onChange={(event) => update(index, { ...input, required: event.target.checked })} type="checkbox" /> Required</label><label><input checked={input.secret === true} onChange={(event) => update(index, event.target.checked ? withoutDefault({ ...input, secret: true }) : { ...input, secret: false })} type="checkbox" /> Secret value</label>{input.secret && <span aria-label="Secret preview">Preview: ••••••••</span>}</div>
          </article>
        ))}</div>
      )}
    </section>
  );
}

function stripOptions(input: WorkflowInputDefinition): WorkflowInputDefinition { const rest = { ...input }; delete rest.options; return rest; }
function withoutDefault(input: WorkflowInputDefinition): WorkflowInputDefinition { const rest = { ...input }; delete rest.defaultValue; return rest; }
function issueAt(issues: ContractIssue[], path: string) { return issues.find((issue) => issue.path === path)?.message; }
