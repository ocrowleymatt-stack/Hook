import "./styles.css";

const modules = [
  { name: "Mega Search", description: "Find people, tools, answers, contradictions and next actions.", status: "Ready" },
  { name: "Slow Cooker", description: "Drop a problem in, let multi-pass reasoning refine it.", status: "Autonomous" },
  { name: "Annex X", description: "Turn raw evidence into court-safe structured entries.", status: "Guarded" },
  { name: "Trainer", description: "Upgrade other apps with prompts, workflows, evals and quality gates.", status: "Boost" }
];

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">HOOK OS</p>
          <h1>Ask. Search. Build. Prove.</h1>
          <p className="subtitle">
            A command centre for high-stakes reasoning, evidence processing, app building and overnight problem solving.
          </p>
        </div>
        <div className="orb" />
      </section>

      <section className="commandCard">
        <label htmlFor="command">Command input</label>
        <textarea id="command" placeholder="Drop the problem here. Make it ugly; Hook will make it useful." />
        <div className="actions">
          <button>Mega Search</button>
          <button>Slow Cook</button>
          <button>Build</button>
          <button>Train App</button>
        </div>
      </section>

      <section className="grid">
        {modules.map((m) => (
          <article className="module" key={m.name}>
            <div className="moduleHeader">
              <h2>{m.name}</h2>
              <span>{m.status}</span>
            </div>
            <p>{m.description}</p>
          </article>
        ))}
      </section>

      <section className="outputPanel">
        <div>
          <p className="eyebrow">OUTPUT</p>
          <h2>World-class answer mode</h2>
          <p>
            Results appear with confidence, assumptions, citations, conflicts, risks and next actions. No mystery soup.
          </p>
        </div>
        <div className="signalBars">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
