import React, { useRef } from 'react';
import PublicArrow from './PublicArrow';
import useSectionMotion from '../hooks/useSectionMotion';

export default function DivisionSplit({ divisions, onSelect }) {
  const sectionRef = useRef(null);
  const { reducedMotion, running } = useSectionMotion(sectionRef);
  return (
    <section
      id="divisions"
      className="rq-divisions"
      ref={sectionRef}
      aria-labelledby="divisions-title"
      data-motion={running ? 'running' : 'paused'}
      data-reduced-motion={String(reducedMotion)}
    >
      <div className="rq-shell rq-section-heading">
        <div>
          <p className="rq-eyebrow">The next chapter</p>
          <h2 id="divisions-title">Two open divisions.</h2>
        </div>
        <p>
          Find your world.
          <br />
          Read our criteria before you apply.
        </p>
      </div>
      <div className="rq-division-grid">
        {divisions.map((division) => (
          <article
            className={`rq-division rq-division--${division.id}`}
            id={division.id}
            key={division.id}
            aria-labelledby={`${division.id}-title`}
          >
            <div className="rq-division__scene" aria-hidden="true">
              <img
                src={division.artwork}
                alt=""
                width="1600"
                height={division.id === 'aion-2' ? 900 : 1062}
                loading="lazy"
              />
            </div>
            <div className="rq-division__content">
              <div className="rq-division__meta">
                <span>{division.number} / Requiem</span>
                <span>Applications open</span>
              </div>
              <div className="rq-division__body">
                <p className="rq-division__focus">{division.focus}</p>
                <h3 id={`${division.id}-title`}>
                  {division.title}
                  {division.edition && <span>{division.edition}</span>}
                </h3>
                <p className="rq-division__description">
                  {division.description}
                </p>
                <a
                  className="rq-division__apply"
                  href="#apply"
                  onClick={() => onSelect(division)}
                >
                  <span>View application criteria</span>
                  <span className="rq-link-circle">
                    <PublicArrow />
                  </span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
