import React from 'react';
import PublicArrow from './PublicArrow';

// Community-supplied history. The publisher source confirms the conquest win.
const COMMUNITY_HISTORY = Object.freeze([
  Object.freeze({
    title: 'Revelation Online',
    icon: '/icons/games/revelation-online.webp',
    achievement:
      'Ranked #1 for several months, with #1–3 rankings across multiple periods.',
  }),
  Object.freeze({
    title: 'ArcheAge: Unchained',
    icon: '/icons/games/archeage-unchained.webp',
    achievement:
      'Top 5 rankings. Two guilds in the top 10 and another in the top 20.',
  }),
  Object.freeze({
    title: 'Riders of Icarus',
    icon: '/icons/games/riders-of-icarus.webp',
    achievement:
      'Ranked #1. Our alliance dominance prompted plans to remove alliances from the game.',
  }),
  Object.freeze({
    title: 'MU Online',
    icon: '/icons/games/mu-online.webp',
    achievement:
      'Ranked #1, with several members in the top 50 and top 10 placements across content.',
  }),
  Object.freeze({
    title: 'MapleStory 2',
    icon: '/icons/games/maplestory-2.webp',
    achievement: 'Top 10 rankings.',
  }),
  Object.freeze({
    title: 'New World',
    icon: '/icons/games/new-world.webp',
    achievement:
      'One of the leading launch guilds on one of the largest servers. Held a town for months without losing it.',
  }),
  Object.freeze({
    title: 'Lost Ark',
    icon: '/icons/games/lost-ark.webp',
    achievement:
      'Guild A ranked #1 and Guild B #3 on Zinnervale. Held S and A PvP islands for several months.',
  }),
  Object.freeze({
    title: 'Throne & Liberty',
    icon: '/icons/games/throne-and-liberty.webp',
    achievement:
      'Global Early Access #1 in Conquest of Guilds. Ranked #1 on Talus, then Lightbringer, for several weeks.',
    source:
      'https://www.playthroneandliberty.com/en-us/news/articles/conquest-of-guilds-global-winners',
  }),
  Object.freeze({
    title: 'Bless Online',
    icon: '/icons/games/bless-online.webp',
    achievement: 'Among the leading guilds.',
  }),
  Object.freeze({
    title: 'Tower of Fantasy',
    icon: '/icons/games/tower-of-fantasy.webp',
    achievement:
      'Ranked #1 on Alintheus for months in daily activity rankings.',
  }),
  Object.freeze({
    title: 'Tarisland',
    icon: '/icons/games/tarisland.webp',
    achievement:
      'High placements in the first raid speedruns and wins in the majority of group arena PvP matches.',
  }),
  Object.freeze({
    title: 'Where Winds Meet',
    icon: '/icons/games/where-winds-meet.webp',
    achievement:
      'Season 1’s #1 activity guild and the first level 6 guild. Top 3–10 in EU guild-versus-guild rankings.',
  }),
]);

export default function GameHistory() {
  return (
    <section id="legacy" className="rq-legacy" aria-labelledby="legacy-title">
      <div className="rq-shell rq-legacy__inner">
        <div className="rq-legacy__identity">
          <img
            src="/icons/Requiem-logo.png"
            alt="Requiem community logo"
            width="709"
            height="711"
            loading="lazy"
          />
          <p className="rq-eyebrow">Requiem / Across the MMO world</p>
        </div>
        <div className="rq-history">
          <div className="rq-history__heading">
            <p className="rq-eyebrow">The name carries on</p>
            <span className="rq-history__count">12 MMO chapters</span>
          </div>
          <h2 id="legacy-title">
            MMOs we’ve
            <br />
            called home.
          </h2>
          <ul>
            {COMMUNITY_HISTORY.map((game) => (
              <li key={game.title}>
                <span className="rq-history__icon" aria-hidden="true">
                  <img
                    src={game.icon}
                    alt=""
                    width="40"
                    height="40"
                    loading="lazy"
                  />
                </span>
                <div className="rq-history__copy">
                  <h3>{game.title}</h3>
                  <p>{game.achievement}</p>
                  {game.source && (
                    <a
                      className="rq-history__source"
                      href={game.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Read the official Throne and Liberty Conquest of Guilds winners"
                    >
                      Official winners <PublicArrow diagonal />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="rq-history__note">
            New worlds. Familiar voices. The same community behind the tag.
          </p>
        </div>
      </div>
    </section>
  );
}
