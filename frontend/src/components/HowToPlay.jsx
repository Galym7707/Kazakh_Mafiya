import React from "react";

const STEPS = [
  { n: 1, title: "Бөлме құр", text: "Бір клик — жаңа бөлме дайын." },
  { n: 2, title: "Достарыңды шақыр", text: "Бөлме кодын немесе сілтемесін жібер." },
  { n: 3, title: "Құпия рөліңді ал", text: "Жасырын карта ашылады." },
  { n: 4, title: "Түнде әрекет ет", text: "Рөліңе сай таңдау жаса." },
  { n: 5, title: "Күндіз талқыла", text: "Күдікті адамды талқылаңдар." },
  { n: 6, title: "Дауыс беріп, шындықты тап", text: "Көпшілік шешеді." },
];

export default function HowToPlay() {
  return (
    <section id="how" className="how-section">
      <h2 className="section-title">Қалай ойнайды?</h2>
      <div className="how-grid">
        {STEPS.map((s) => (
          <div key={s.n} className="how-card">
            <div className="how-num">{s.n}</div>
            <div className="how-body">
              <h3 className="how-title">{s.title}</h3>
              <p className="how-text">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
