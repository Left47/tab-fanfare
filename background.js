// Plays the fanfare on every new tab. The toolbar button toggles mute.

// Don't overlap fanfares when many tabs open at once (session restore,
// "open all in tabs", etc.).
const COOLDOWN_MS = 1500;
let lastPlayed = 0;

async function isEnabled() {
  const { enabled = true } = await browser.storage.local.get("enabled");
  return enabled;
}

function renderButton(enabled) {
  browser.action.setBadgeText({ text: enabled ? "" : "off" });
  browser.action.setBadgeBackgroundColor({ color: "#555" });
  browser.action.setTitle({
    title: enabled ? "Tab Fanfare: on (click to mute)" : "Tab Fanfare: muted (click to unmute)",
  });
}

browser.tabs.onCreated.addListener(async () => {
  if (!(await isEnabled())) return;
  const now = Date.now();
  if (now - lastPlayed < COOLDOWN_MS) return;
  lastPlayed = now;
  playFanfare();
});

browser.action.onClicked.addListener(async () => {
  const enabled = !(await isEnabled());
  await browser.storage.local.set({ enabled });
  renderButton(enabled);
  if (enabled) playFanfare();
});

isEnabled().then(renderButton);
