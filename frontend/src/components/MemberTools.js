import React, { useEffect, useRef } from 'react';
import PublicArrow from './PublicArrow';

const MEMBER_TOOLS = Object.freeze([
  Object.freeze({
    division: 'Aion 2',
    name: 'GuildVoice',
    url: 'https://guildvoice.dream-dev.online/',
    artwork: '/artwork/aion-2-hero.webp',
  }),
  Object.freeze({
    division: 'WoW Forever',
    name: 'OXM',
    url: 'https://forever.oxm.gg/my/dashboard',
    artwork: '/artwork/wow-forever.webp',
  }),
]);

export default function MemberTools({ open, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const closeFromBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      onClose();
    }
  };

  return (
    <dialog
      id="member-tools-dialog"
      className="rq-member-tools"
      ref={dialogRef}
      aria-labelledby="member-tools-title"
      aria-describedby="member-tools-description"
      onCancel={onClose}
      onClose={onClose}
      onClick={closeFromBackdrop}
    >
      <div className="rq-member-tools__inner">
        <div className="rq-member-tools__top">
          <span className="rq-member-tools__brand">Requiem</span>
          <button
            type="button"
            className="rq-member-tools__close"
            onClick={onClose}
            aria-label="Close member tools"
            autoFocus
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p className="rq-eyebrow">For our members</p>
        <h2 id="member-tools-title">Member tools.</h2>
        <p id="member-tools-description">Choose your division’s guild tool.</p>
        <ul className="rq-member-tools__list">
          {MEMBER_TOOLS.map((tool) => (
            <li key={tool.division}>
              <a
                className="rq-member-tools__link"
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${tool.name} for ${tool.division} (new tab)`}
              >
                <img
                  src={tool.artwork}
                  alt=""
                  width="64"
                  height="64"
                  loading="lazy"
                />
                <span className="rq-member-tools__copy">
                  <span className="rq-member-tools__division">
                    {tool.division}
                  </span>
                  <span className="rq-member-tools__name">{tool.name}</span>
                </span>
                <PublicArrow diagonal />
              </a>
            </li>
          ))}
        </ul>
        <p className="rq-member-tools__note">Tools open in a new tab.</p>
      </div>
    </dialog>
  );
}
