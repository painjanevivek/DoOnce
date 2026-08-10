"use client";

import { useRef, useState } from "react";
import { authoringPaths } from "./site-content";

export function AuthoringAccordion() {
  const [activeId, setActiveId] = useState(authoringPaths[0].id);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(currentIndex: number, nextIndex: number) {
    const normalizedIndex =
      (nextIndex + authoringPaths.length) % authoringPaths.length;
    const nextPath = authoringPaths[normalizedIndex];

    setActiveId(nextPath.id);
    buttonRefs.current[normalizedIndex]?.focus();
  }

  return (
    <div className="authoring-accordion">
      {authoringPaths.map((path, index) => {
        const expanded = path.id === activeId;
        const buttonId = `authoring-${path.id}-button`;
        const panelId = `authoring-${path.id}-panel`;

        return (
          <section
            className="authoring-accordion__item"
            data-expanded={expanded}
            key={path.id}
          >
            <button
              aria-controls={panelId}
              aria-expanded={expanded}
              id={buttonId}
              onClick={() => setActiveId(path.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  moveFocus(index, index + 1);
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveFocus(index, index - 1);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  moveFocus(index, 0);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  moveFocus(index, authoringPaths.length - 1);
                }
              }}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{path.title}</strong>
            </button>
            <div
              aria-labelledby={buttonId}
              className="authoring-accordion__panel"
              hidden={!expanded}
              id={panelId}
              role="region"
            >
              <p>{path.summary}</p>
              <small>{path.proof}</small>
            </div>
          </section>
        );
      })}
    </div>
  );
}
