"use client";

import { useState } from "react";
import { exampleScenarios } from "./site-content";

export function ScenarioCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scenario = exampleScenarios[activeIndex];

  function selectRelative(offset: number) {
    setActiveIndex(
      (current) =>
        (current + offset + exampleScenarios.length) % exampleScenarios.length,
    );
  }

  return (
    <div className="scenario-carousel">
      <article className="scenario-card" key={scenario.role}>
        <div className="scenario-card__heading">
          <span>Example scenario</span>
          <small>
            {String(activeIndex + 1).padStart(2, "0")} / 0
            {exampleScenarios.length}
          </small>
        </div>
        <p className="scenario-card__role">{scenario.role}</p>
        <h3>{scenario.task}</h3>
        <dl>
          <div>
            <dt>Input</dt>
            <dd>{scenario.authoring}</dd>
          </div>
          <div>
            <dt>Verified when</dt>
            <dd>{scenario.verification}</dd>
          </div>
          <div>
            <dt>Result</dt>
            <dd>{scenario.artifact}</dd>
          </div>
        </dl>
      </article>
      <div className="scenario-carousel__controls">
        <button
          aria-label="Previous example scenario"
          onClick={() => selectRelative(-1)}
          type="button"
        >
          Previous
        </button>
        <div aria-label="Choose example scenario" role="group">
          {exampleScenarios.map((item, index) => (
            <button
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Show ${item.role} example`}
              key={item.role}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span className="sr-only">{item.role}</span>
            </button>
          ))}
        </div>
        <button
          aria-label="Next example scenario"
          onClick={() => selectRelative(1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
