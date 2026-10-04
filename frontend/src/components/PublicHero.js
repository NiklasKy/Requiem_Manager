import React, { useEffect, useRef } from 'react';
import PublicArrow from './PublicArrow';
import useSectionMotion from '../hooks/useSectionMotion';

export default function PublicHero({ members }) {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const { reducedMotion, running } = useSectionMotion(heroRef);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (running) video.play().catch(() => {});
    else video.pause();
    return () => video.pause();
  }, [running, reducedMotion]);
  return (
    <section
      className="rq-hero"
      ref={heroRef}
      aria-labelledby="hero-title"
      data-motion={running ? 'running' : 'paused'}
      data-reduced-motion={String(reducedMotion)}
    >
      <div className="rq-hero__visual" aria-hidden="true">
        <div className="rq-hero__scene">
          <img
            className="rq-hero__poster"
            src="/artwork/requiem-banner.webp"
            alt=""
            width="1920"
            height="1080"
            fetchpriority="high"
          />
          {!reducedMotion && (
            <video
              className="rq-hero__video"
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              width="500"
              height="282"
              tabIndex={-1}
            >
              <source
                src="/artwork/requiem-atmosphere.webm"
                type="video/webm"
              />
              <source src="/artwork/requiem-atmosphere.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </div>
      <div className="rq-shell rq-hero__inner">
        <div className="rq-hero__intro">
          <p className="rq-eyebrow">MMO community / Hardcore & semi-hardcore</p>
          <h1 id="hero-title">Requiem</h1>
          <p className="rq-hero__description">
            For the progression. For the team.
            <br />
            For the people behind the characters.
          </p>
          <a className="rq-button rq-button--primary" href="#divisions">
            Explore our divisions <PublicArrow />
          </a>
        </div>
        <div className="rq-hero__footer">
          <p>
            One community.
            <br />
            <span>Across the MMO world.</span>
          </p>
          <p className="rq-community__members">
            {members !== null ? (
              <>
                <strong>{members.toLocaleString('en-US')} members</strong>
                <span>behind the Requiem name.</span>
              </>
            ) : (
              <>
                <strong>Built around our people.</strong>
                <span>Across games. Across years.</span>
              </>
            )}
          </p>
          <a
            href="#divisions"
            className="rq-hero__scroll"
            aria-label="Scroll to open divisions"
          >
            <span>Open divisions</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
