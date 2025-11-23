export default function SharedLoader({ text = "Loading…" }) {
  return (
    <div
      style={{
        padding: 20,
        textAlign: "center",
        color: "#ecf0f1",
      }}
    >
      {text}
    </div>
  );
}
