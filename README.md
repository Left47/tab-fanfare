# Tab Fanfare

A Firefox extension that plays a short cinematic "ta-DUM" every time you open a new tab.

The sound is generated with the Web Audio API in [fanfare.js](fanfare.js), so the extension ships no audio files. It is two deep hits, and the second one opens into a low chord with reverb.

## Try it

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `manifest.json` in this folder.
3. Open a new tab.

Or, with web-ext installed: `npx web-ext run`

## Controls

- Click the toolbar button to mute or unmute. The button shows an "off" badge while muted.
- The fanfare won't play again within 1.5 seconds of the last one, so opening many tabs at once plays it only once.

## Tweaking the sound

All the settings are in `playFanfare()` and `bloom()` in [fanfare.js](fanfare.js):

- `volume`: overall loudness (default 0.8)
- the `0.34` offset: the gap between "ta" and "DUM"
- `pitch` on each hit, and `root` in `bloom()`: how deep it sounds
- `length` in `bloom()`: how long the tail rings out

## License

[MIT](LICENSE)
