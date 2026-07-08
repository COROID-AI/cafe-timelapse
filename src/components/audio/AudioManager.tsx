'use client';

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';
import { useTimePeriodStore } from '@/lib/store';
import { Howl } from 'howler';

interface AudioContextType {
  playMusic: (track: string) => void;
  stopMusic: () => void;
  playSound: (sound: string) => void;
  setMasterVolume: (volume: number) => void;
  masterVolume: number;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Audio configuration derived from PeriodConfig
const PERIOD_AUDIO_CONFIG = Object.fromEntries(
  Object.entries(PERIOD_CONFIGS).map(([period, config]) => [
    period,
    {
      music: config.audio.music,
      conversation: config.audio.conversation,
      equipment: config.audio.equipment,
      musicVolume: config.audio.musicVolume,
      conversationVolume: config.audio.conversationVolume,
      equipmentVolume: config.audio.equipmentVolume,
    },
  ])
);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [masterVolume, setMasterVolume] = useState(0.5);
  const musicRef = useRef<Howl | null>(null);
  const conversationRef = useRef<Howl | null>(null);
  const equipmentRef = useRef<Howl | null>(null);
  const currentPeriodRef = useRef<Period | null>(null);

  const currentPeriod = useTimePeriodStore((state) => state.currentPeriod);
  const isTransitioning = useTimePeriodStore((state) => state.isTransitioning);

  // Audio asset paths (using generated tones since actual audio files don't exist)
  const getAudioUrl = (type: string, period: Period): string => {
    // For now, return placeholder URLs - in production these would be actual audio files
    return `/audio/period-ambience/${type}-${period}.mp3`;
  };

  const fadeAudio = useCallback((sound: Howl | null, duration: number = 1000) => {
    if (sound) {
      sound.fade(sound.volume(), 0, duration);
      setTimeout(() => {
        sound.stop();
      }, duration);
    }
  }, []);

  const transitionToPeriodAudio = useCallback(
    (period: Period) => {
      const config = PERIOD_AUDIO_CONFIG[period as keyof typeof PERIOD_AUDIO_CONFIG];

      // Fade out current audio
      fadeAudio(musicRef.current, 500);
      fadeAudio(conversationRef.current, 500);
      fadeAudio(equipmentRef.current, 500);

      // Load and play new audio with slight delay for fade effect
      setTimeout(() => {
        // Music track
        if (config.music) {
          musicRef.current = new Howl({
            src: [getAudioUrl(config.music, period)],
            volume: 0,
            loop: true,
            onload: () => {
              musicRef.current?.fade(0, config.musicVolume * masterVolume, 500);
              musicRef.current?.play();
            },
            onloaderror: () => {
              // Fallback to silent audio for missing files
              console.warn(`Audio file not found: ${config.music}-${period}`);
            },
          });
        }

        // Conversation murmur
        if (config.conversation) {
          conversationRef.current = new Howl({
            src: [getAudioUrl(config.conversation, period)],
            volume: 0,
            loop: true,
            onload: () => {
              conversationRef.current?.fade(0, config.conversationVolume * masterVolume, 500);
              conversationRef.current?.play();
            },
            onloaderror: () => {
              console.warn(`Audio file not found: ${config.conversation}-${period}`);
            },
          });
        }

        // Equipment sounds
        if (config.equipment) {
          equipmentRef.current = new Howl({
            src: [getAudioUrl(config.equipment, period)],
            volume: 0,
            loop: true,
            onload: () => {
              equipmentRef.current?.fade(0, config.equipmentVolume * masterVolume, 500);
              equipmentRef.current?.play();
            },
            onloaderror: () => {
              console.warn(`Audio file not found: ${config.equipment}-${period}`);
            },
          });
        }
      }, 250);
    },
    [masterVolume]
  );

  useEffect(() => {
    if (currentPeriodRef.current && currentPeriodRef.current !== currentPeriod) {
      transitionToPeriodAudio(currentPeriod);
    }
    currentPeriodRef.current = currentPeriod;

    return () => {
      if (musicRef.current) {
        musicRef.current.stop();
      }
      if (conversationRef.current) {
        conversationRef.current.stop();
      }
      if (equipmentRef.current) {
        equipmentRef.current.stop();
      }
    };
  }, [currentPeriod, transitionToPeriodAudio]);

  const playMusic = useCallback(
    (track: string) => {
      if (musicRef.current?.playing()) {
        musicRef.current?.stop();
      }
      musicRef.current = new Howl({
        src: [getAudioUrl(track, currentPeriod)],
        volume: masterVolume,
        loop: true,
      });
      musicRef.current.play();
    },
    [currentPeriod, masterVolume]
  );

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.stop();
    }
  }, []);

  const playSound = useCallback((sound: string) => {
    const soundHowl = new Howl({
      src: [getAudioUrl(sound, currentPeriod)],
      volume: masterVolume * 0.5,
    });
    soundHowl.play();
  }, [currentPeriod, masterVolume]);

  return (
    <AudioContext.Provider value={{ playMusic, stopMusic, playSound, setMasterVolume, masterVolume }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}