// Grey box shown in place of any UI slot that has no real component yet. It prints the slot name and
// the exact props it received (as JSON), so the UI team can see what their component will get.
const safe = (props) =>
  JSON.stringify(props, (_k, v) => (typeof v === "function" ? "[function]" : v), 2);

export default function Placeholder({ name, props = {}, note }) {
  return (
    <div
      data-slot={name}
      style={{ background: "#2b2f3a", color: "#c9cfdd", border: "1px dashed #6b7280", borderRadius: 6,
               padding: 8, margin: 4, fontFamily: "monospace", fontSize: 12, overflow: "auto", maxHeight: 220 }}
    >
      <strong>{name}</strong> <em>(placeholder)</em>
      {note ? <div style={{ color: "#f59e0b" }}>{note}</div> : null}
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{safe(props)}</pre>
    </div>
  );
}
