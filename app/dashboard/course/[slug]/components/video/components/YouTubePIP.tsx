import React, { useState, useRef, useEffect } from 'react';

const YouTubePIP = ({
  videoId,
  width = 560,
  height = 315,
  playerVars = {},
  onEnterPIP,
  onExitPIP,
  pipPosition = 'bottom-right',
  pipWidth = 320,
  pipHeight = 180,
  closeOnEscape = true,
  showControls = true,
  autoPlay = true
}) => {
  const [isPIP, setIsPIP] = useState(false);
  const [player, setPlayer] = useState(null);
  const pipContainerRef = useRef(null);
  const originalParentRef = useRef(null);
  const originalStylesRef = useRef({});

  // YouTube API setup
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (window.YT && window.YT.Player) {
      const newPlayer = new window.YT.Player(`youtube-player-${videoId}`, {
        width,
        height,
        videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: showControls ? 1 : 0,
          ...playerVars
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
          }
        }
      });
    }
  };

  const enterPIP = () => {
    if (!player || isPIP) return;

    const playerElement = document.getElementById(`youtube-player-${videoId}`);
    if (!playerElement) return;

    // Store original state
    originalParentRef.current = playerElement.parentNode;
    originalStylesRef.current = {
      width: playerElement.style.width,
      height: playerElement.style.height,
      position: playerElement.style.position,
      top: playerElement.style.top,
      left: playerElement.style.left,
      zIndex: playerElement.style.zIndex
    };

    // Create PIP container
    const pipContainer = document.createElement('div');
    pipContainer.className = 'youtube-pip-container';
    pipContainer.style.cssText = `
      position: fixed;
      ${getPIPPosition(pipPosition)};
      width: ${pipWidth}px;
      height: ${pipHeight}px;
      z-index: 10000;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      z-index: 10001;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.onclick = exitPIP;

    pipContainer.appendChild(closeButton);
    document.body.appendChild(pipContainer);

    // Move player to PIP container
    pipContainer.appendChild(playerElement);
    playerElement.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      position: static !important;
    `;

    pipContainerRef.current = pipContainer;
    setIsPIP(true);
    onEnterPIP?.();
  };

  const exitPIP = () => {
    if (!isPIP || !pipContainerRef.current) return;

    const playerElement = document.getElementById(`youtube-player-${videoId}`);
    if (playerElement && originalParentRef.current) {
      // Move player back to original position
      originalParentRef.current.appendChild(playerElement);
      
      // Restore original styles
      Object.assign(playerElement.style, originalStylesRef.current);
    }

    // Remove PIP container
    if (pipContainerRef.current) {
      document.body.removeChild(pipContainerRef.current);
      pipContainerRef.current = null;
    }

    setIsPIP(false);
    onExitPIP?.();
  };

  const getPIPPosition = (position) => {
    const margin = 20;
    const positions = {
      'top-left': `top: ${margin}px; left: ${margin}px;`,
      'top-right': `top: ${margin}px; right: ${margin}px;`,
      'bottom-left': `bottom: ${margin}px; left: ${margin}px;`,
      'bottom-right': `bottom: ${margin}px; right: ${margin}px;`,
      'center': `top: 50%; left: 50%; transform: translate(-50%, -50%);`
    };
    return positions[position] || positions['bottom-right'];
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (closeOnEscape && event.key === 'Escape' && isPIP) {
        exitPIP();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPIP, closeOnEscape]);

  return (
    <div className="youtube-pip-wrapper">
      <div id={`youtube-player-${videoId}`} />
      
      {!isPIP && (
        <button
          onClick={enterPIP}
          className="pip-enter-button"
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#ff0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Enter PIP Mode
        </button>
      )}
    </div>
  );
};

export default YouTubePIP;