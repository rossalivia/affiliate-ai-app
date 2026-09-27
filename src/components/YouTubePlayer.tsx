'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, AlertCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  isShort?: boolean;
  originalUrl: string;
  onEnded: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  isShort = false,
  originalUrl,
  onEnded,
}) => {
  const containerDomId = `yt-player-${videoId}`;
  const playerRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  const [loadError, setLoadError] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let isCancelled = false;

    // Load YouTube Iframe API script if not already present
    function loadApi(): Promise<void> {
      return new Promise((resolve) => {
        if (typeof window === 'undefined') return;

        if (window.YT && window.YT.Player) {
          resolve();
          return;
        }

        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          } else {
            document.head.appendChild(tag);
          }
        }

        // Store existing callback if any
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevCallback) prevCallback();
          resolve();
        };

        // Fallback safety timeout if script doesn't fire callback
        const checkInterval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 6000);
      });
    }

    loadApi().then(() => {
      if (isCancelled) return;

      try {
        if (!window.YT || !window.YT.Player) {
          setLoadError(true);
          return;
        }

        // Clean up previous instance
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player(containerDomId, {
          videoId,
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          events: {
            onReady: () => {
              if (!isCancelled) {
                setIsPlayerReady(true);
              }
            },
            onStateChange: (event: any) => {
              // window.YT.PlayerState.ENDED is 0
              if (event.data === 0) {
                onEndedRef.current();
              }
            },
            onError: () => {
              if (!isCancelled) {
                setLoadError(true);
              }
            },
          },
        });
      } catch (err) {
        console.error('Error initializing YouTube Player:', err);
        setLoadError(true);
      }
    });

    return () => {
      isCancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [videoId, containerDomId]);

  if (loadError) {
    return (
      <div className="w-full p-8 bg-[#F8F8F6] border-2 border-dashed border-[#E6E6E1] rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#06152E]">
            Materi tidak dapat ditampilkan langsung di halaman.
          </h3>
          <p className="text-sm text-[#5A6A85] max-w-md mx-auto">
            Anda tetap dapat mempelajari materi ini langsung melalui tautan resmi YouTube.
          </p>
        </div>
        <div className="pt-2">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-bold transition-colors rounded-xl text-sm px-5 py-2.5 gap-2 bg-[#1F7AFF] text-white hover:bg-[#1664D6] shadow-xs"
          >
            <span>Buka di YouTube</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-md border border-[#E6E6E1]/80 ${
          isShort
            ? 'max-w-[360px] aspect-[9/16]'
            : 'aspect-video'
        }`}
      >
        <div
          id={containerDomId}
          className="w-full h-full"
          title={`Video materi: ${title}`}
          aria-label={`Video materi: ${title}`}
        />
      </div>
    </div>
  );
};
