import React, { useState } from "react";

const ITEMS = [
  {
    q: "Ойында қанша адам керек?",
    a: "Кемінде 4 ойыншы керек. Тест үшін бот қосуға болады.",
  },
  {
    q: "Бот қосуға бола ма?",
    a: "Иә. Боттар демо және тест үшін керек. Олар автоматты түрде әрекет етеді.",
  },
  {
    q: "Түнде не болады?",
    a: "Түнде арнайы рөлдер өз әрекетін таңдайды. Хуторлықтар бір ойыншыны ойыннан шығаруға тырысады.",
  },
  {
    q: "Күндіз не болады?",
    a: "Күндіз ойыншылар сөйлесіп, күдікті адамға дауыс береді.",
  },
  {
    q: "Рөлдер қашан ашылады?",
    a: "Ойын кезінде әркім тек өз рөлін көреді. Ойыннан шыққан адамның рөлі ашылады. Соңында барлық рөлдер көрсетіледі.",
  },
  {
    q: "Телефоннан ойнауға бола ма?",
    a: "Иә. Ойын браузерде жұмыс істейді және телефонға бейімделген.",
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState(-1);
  return (
    <section id="faq" className="faq-section">
      <h2 className="section-title">Жиі қойылатын сұрақтар</h2>
      <div className="faq-list">
        {ITEMS.map((it, i) => {
          const isOpen = i === open;
          return (
            <div key={i} className={"faq-item " + (isOpen ? "open" : "")}>
              <button
                className="faq-q"
                onClick={() => setOpen(isOpen ? -1 : i)}
                type="button"
                aria-expanded={isOpen}
              >
                <span>{it.q}</span>
                <span className="faq-chev">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <div className="faq-a">{it.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
