const sounds: Record<string, HTMLAudioElement> = {};

const SOUND_URLS = {
  click: "https://4pmllzkk3e.ufs.sh/f/80lTYgNxh6Oa7x5XxZKW5oawPmgV2uns9fHdZUkeD0RqASc8",
  strike: "https://4pmllzkk3e.ufs.sh/f/80lTYgNxh6Oa3Y47wgpt7NFAklH0ZoGBJwQmaqM8IxOcCXKD",
  solved: "https://4pmllzkk3e.ufs.sh/f/80lTYgNxh6Oaf4iRlS5ZwTGZCPxir9Ot4lvzgcEhpnRu5AUN",
  explode: "https://4pmllzkk3e.ufs.sh/f/80lTYgNxh6OabQOyIT4VRSixg9lCymcOdz1rp0Ls5Bn2DYjT",
  beep: "https://4pmllzkk3e.ufs.sh/f/80lTYgNxh6OaPaM5y7OkrNBQiW29MbzKGwLtURnjZv48pOgl",
};

let beepInterval: NodeJS.Timeout | null = null;

export function initSounds() {
  Object.entries(SOUND_URLS).forEach(([name, url]) => {
    sounds[name] = new Audio(url);
    sounds[name].preload = "auto";
  });
}

export function playSound(name: keyof typeof SOUND_URLS, delay = 0) {
  const sound = sounds[name];
  if (sound) {
    sound.currentTime = 0;
    if (delay > 0) {
      setTimeout(() => sound.play().catch(() => {}), delay);
    } else {
      sound.play().catch(() => {});
    }
  }
}

export function startBeepLoop(intervalMs = 1000) {
  stopBeepLoop();
  const sound = sounds.beep;
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
    beepInterval = setInterval(() => {
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    }, intervalMs);
  }
}

export function stopBeepLoop() {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
  const beepSound = sounds.beep;
  if (beepSound) {
    beepSound.pause();
    beepSound.currentTime = 0;
  }
}

export const initSoundsOnClient = () => {
  if (typeof window !== "undefined") {
    initSounds();
  }
};