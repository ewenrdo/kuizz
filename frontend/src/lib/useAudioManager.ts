"use client";

import { useCallback, useEffect, useState } from "react";

type BackgroundTrack = "lobby" | "game" | "victory";

const SOUND_PATHS: Record<BackgroundTrack | "click", string> = {
  lobby: "/sounds/lobby.mp3",
  game: "/sounds/game.mp3",
  victory: "/sounds/victory.mp3",
  click: "/sounds/click.mp3",
};

const listeners = new Set<(isMuted: boolean) => void>();
let isMuted = false;
let backgroundAudio: HTMLAudioElement | null = null;
const effectAudio = new Set<HTMLAudioElement>();

const notifyMuteChange = () => {
  listeners.forEach((listener) => listener(isMuted));
};

const handlePlaybackError = (error: unknown, source: string) => {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    console.debug(`Audio playback requires user interaction: ${source}`);
    return;
  }

  console.error(`Unable to play audio: ${source}`, error);
};

const playAudio = (audio: HTMLAudioElement, source: string) => {
  void audio.play().catch((error: unknown) => {
    handlePlaybackError(error, source);
  });
};

const stopBackground = () => {
  if (!backgroundAudio) return;

  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
  backgroundAudio = null;
};

const playBackground = (track: BackgroundTrack, volume: number, loop: boolean) => {
  if (typeof window === "undefined") return;

  stopBackground();

  const audio = new Audio(SOUND_PATHS[track]);
  audio.loop = loop;
  audio.volume = volume;
  audio.muted = isMuted;
  backgroundAudio = audio;
  playAudio(audio, SOUND_PATHS[track]);
};

const playEffect = () => {
  if (typeof window === "undefined") return;

  const audio = new Audio(SOUND_PATHS.click);
  audio.volume = 0.4;
  audio.muted = isMuted;
  effectAudio.add(audio);
  audio.addEventListener("ended", () => {
    effectAudio.delete(audio);
  });
  playAudio(audio, SOUND_PATHS.click);
};

export function useAudioManager() {
  const [muted, setMuted] = useState(isMuted);

  useEffect(() => {
    const listener = (nextIsMuted: boolean) => setMuted(nextIsMuted);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const playLobbyBgm = useCallback(() => {
    playBackground("lobby", 0.3, true);
  }, []);

  const playGameBgm = useCallback(() => {
    playBackground("game", 0.3, true);
  }, []);

  const playVictoryBgm = useCallback(() => {
    playBackground("victory", 0.5, false);
  }, []);

  const playClick = useCallback(() => {
    playEffect();
  }, []);

  const stopAll = useCallback(() => {
    stopBackground();
  }, []);

  const toggleMute = useCallback(() => {
    isMuted = !isMuted;

    if (backgroundAudio) backgroundAudio.muted = isMuted;
    effectAudio.forEach((audio) => {
      audio.muted = isMuted;
    });
    notifyMuteChange();
  }, []);

  return {
    isMuted: muted,
    playLobbyBgm,
    playGameBgm,
    playVictoryBgm,
    playClick,
    stopAll,
    toggleMute,
  };
}
