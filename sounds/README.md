# Sound Files

This folder contains audio files used by the Jungle Sound Bot (`/js` command).

## Required Files

Place the following audio files in this folder before building the Docker container:

| File | Purpose |
|------|---------|
| `jungle_intro.mp3` | Played **once** when the bot first joins Channel 1 |
| `jungle.mp3` | Played every **5 minutes** in the rotation loop |

## Supported Formats

`mp3`, `ogg`, `wav` — configure the file paths via `.env`:

```env
SOUNDBOT_INTRO_FILE=sounds/jungle_intro.mp3
SOUNDBOT_LOOP_FILE=sounds/jungle.mp3
```

## Note

These files are not tracked by git (see `.gitignore`). You must add them manually to the server before running `docker-compose up --build`.
