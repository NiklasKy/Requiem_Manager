import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import PublicHero from '../components/PublicHero';
import DivisionSplit from '../components/DivisionSplit';
import GameHistory from '../components/GameHistory';
import MemberTools from '../components/MemberTools';
import PublicArrow from '../components/PublicArrow';
import './LandingPage.css';

const DISCORD_URL = 'https://discord.gg/requiem-community';
const DIVISIONS = Object.freeze([
  Object.freeze({
    id: 'aion-2',
    number: '01',
    title: 'Aion 2',
    artwork: '/artwork/aion-2-hero.webp',
    promoUrl: 'https://www.youtube.com/watch?v=Q_P8g4_X2cU',
    focus: 'PvE / PvP / Guild progression',
    description:
      'Build our next division in Atreia. Find your group, prepare for endgame, and help shape Requiem’s next chapter.',
  }),
  Object.freeze({
    id: 'wow-forever',
    number: '02',
    title: 'World of Warcraft',
    edition: 'Forever',
    artwork: '/artwork/wow-forever.webp',
    focus: 'Dungeons / Raids / Guild progression',
    description:
      'A new home in Azeroth. Join a team that cares about the journey, the preparation, and the next pull together.',
  }),
]);

// Community-supplied application criteria.
const JOIN_CRITERIA = Object.freeze([
  Object.freeze({
    title: 'No gooning, simping or ERP.',
    text: 'Keep the guild focused on gaming.',
  }),
  Object.freeze({
    title: 'Competitive mindset.',
    text: 'We aim to dominate our server. Share that ambition and play to win.',
  }),
  Object.freeze({
    title: 'Basic P2W commitment.',
    text: 'We are not a free-to-play guild. A basic pay-to-win investment is expected.',
  }),
  Object.freeze({
    title: 'PvP enjoyer.',
    text: 'Enjoy the fights and want to compete against other players.',
  }),
]);

function useMemberCount() {
  const [members, setMembers] = useState(null);
  useEffect(() => {
    let active = true;
    apiService
      .getLandingStats()
      .then((data) => {
        if (
          active &&
          Number.isSafeInteger(data?.member_count) &&
          data.member_count > 0
        )
          setMembers(data.member_count);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return members;
}

export default function LandingPage() {
  const members = useMemberCount();
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [memberToolsOpen, setMemberToolsOpen] = useState(false);
  return (
    <div className="rq-public" id="top">
      <a className="rq-skip" href="#main-content">
        Skip to content
      </a>
      <header className="rq-header">
        <div className="rq-shell rq-header__inner">
          <a className="rq-brand" href="#top" aria-label="Requiem home">
            <img src="/icons/Requiem-logo.png" alt="" width="48" height="48" />
            <span>
              <span className="rq-brand__name">Requiem</span>
              <span className="rq-brand__caption">MMO community</span>
            </span>
          </a>
          <nav className="rq-nav" aria-label="Main navigation">
            <a href="#divisions">Divisions</a>
            <a href="#apply">Applications</a>
            <a href="#legacy">Our story</a>
          </nav>
          <button
            type="button"
            className="rq-member-link"
            aria-haspopup="dialog"
            aria-controls="member-tools-dialog"
            aria-expanded={memberToolsOpen}
            onClick={() => setMemberToolsOpen(true)}
          >
            Member tools <PublicArrow />
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <PublicHero members={members} />
        <DivisionSplit divisions={DIVISIONS} onSelect={setSelectedDivision} />
        <section id="apply" className="rq-apply" aria-labelledby="apply-title">
          <div className="rq-shell rq-apply__inner">
            <div className="rq-apply__intro">
              <div className="rq-apply__label">
                <p className="rq-eyebrow">Before you apply</p>
              </div>
              <h2 id="apply-title">
                How we play.
                <br />
                What we expect.
              </h2>
              <p>
                Hardcore and semi-hardcore groups work when the people behind
                them share the same approach.
              </p>
            </div>
            <ol className="rq-criteria">
              {JOIN_CRITERIA.map((item, index) => (
                <li key={item.title}>
                  <span className="rq-criteria__number">0{index + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="rq-application">
              <div>
                <p className="rq-application__selection" aria-live="polite">
                  {selectedDivision
                    ? `Applying for ${selectedDivision.title}${selectedDivision.edition ? ` ${selectedDivision.edition}` : ''}`
                    : 'Aion 2 & WoW Forever applications'}
                </p>
                <h3>Ready to play with us?</h3>
                <p>
                  Applications happen in Discord. Join the community, find your
                  division’s application area, and introduce yourself.
                </p>
              </div>
              <a
                className="rq-button rq-button--primary"
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/icons/discord.svg" alt="" width="20" height="20" />
                Apply on Discord <PublicArrow diagonal />
              </a>
            </div>
          </div>
        </section>
        <GameHistory />
      </main>
      <footer className="rq-footer">
        <div className="rq-shell rq-footer__inner">
          <a className="rq-footer__brand" href="#top">
            Requiem<span>MMO gaming community</span>
          </a>
          <p>
            © {new Date().getFullYear()} Requiem
            <br />
            <span>Logos by Ryo · Website by Niklas Ky</span>
            <br />
            <span>Game artwork belongs to its respective publishers.</span>
          </p>
          <div>
            <a href="#apply">Applications</a>
            <button
              type="button"
              className="rq-footer__member"
              aria-haspopup="dialog"
              aria-controls="member-tools-dialog"
              aria-expanded={memberToolsOpen}
              onClick={() => setMemberToolsOpen(true)}
            >
              Member tools
            </button>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
      <MemberTools
        open={memberToolsOpen}
        onClose={() => setMemberToolsOpen(false)}
      />
    </div>
  );
}
