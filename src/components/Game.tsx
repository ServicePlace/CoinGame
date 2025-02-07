import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  velocityX: number;
  isJumping: boolean;
  jumpTime: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Reduced gravity for space-like feel
const GRAVITY = 0.3;
const INITIAL_JUMP_FORCE = -10;
const MAX_JUMP_TIME = 15; // Maximum frames to hold jump
const HOLD_JUMP_FORCE = -0.5; // Additional force while holding jump
const MOVEMENT_SPEED = 3;
const FRICTION = 0.98;

const PLATFORMS: Platform[] = [
  { x: 0, y: 400, width: 800, height: 20 },
  { x: 300, y: 300, width: 200, height: 20 },
  { x: 100, y: 200, width: 200, height: 20 },
];

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const [character, setCharacter] = useState<HTMLImageElement | null>(null);
  const gameObjectRef = useRef<GameObject>({
    x: 50,
    y: 200,
    width: 32,
    height: 32,
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    jumpTime: 0,
  });

  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setCharacter(img);
      };
    }
  };

  const checkCollision = (obj: GameObject, platform: Platform) => {
    return (
      obj.x < platform.x + platform.width &&
      obj.x + obj.width > platform.x &&
      obj.y < platform.y + platform.height &&
      obj.y + obj.height > platform.y
    );
  };

  const updateGameObject = useCallback((gameObject: GameObject, keys: { [key: string]: boolean }) => {
    const newGameObject = { ...gameObject };

    // Apply space-like movement with momentum
    if (keys['ArrowLeft']) {
      newGameObject.velocityX -= MOVEMENT_SPEED * 0.1;
    }
    if (keys['ArrowRight']) {
      newGameObject.velocityX += MOVEMENT_SPEED * 0.1;
    }

    // Apply friction to horizontal movement
    newGameObject.velocityX *= FRICTION;
    newGameObject.x += newGameObject.velocityX;

    // Handle jumping
    if (keys[' ']) {
      if (!newGameObject.isJumping) {
        // Initial jump
        newGameObject.velocityY = INITIAL_JUMP_FORCE;
        newGameObject.isJumping = true;
        newGameObject.jumpTime = 0;
      } else if (newGameObject.jumpTime < MAX_JUMP_TIME) {
        // Continue adding force while holding jump
        newGameObject.velocityY += HOLD_JUMP_FORCE;
        newGameObject.jumpTime++;
      }
    } else {
      // Reset jump time when space is released
      newGameObject.jumpTime = MAX_JUMP_TIME;
    }

    // Apply gravity
    newGameObject.velocityY += GRAVITY;
    newGameObject.y += newGameObject.velocityY;

    // Check platform collisions
    let isOnPlatform = false;
    for (const platform of PLATFORMS) {
      if (checkCollision(newGameObject, platform)) {
        // Collision from above
        if (gameObject.y + gameObject.height <= platform.y + 10) {
          newGameObject.y = platform.y - newGameObject.height;
          newGameObject.velocityY = 0;
          newGameObject.isJumping = false;
          isOnPlatform = true;
        }
      }
    }

    // Keep character within canvas bounds
    newGameObject.x = Math.max(0, Math.min(800 - newGameObject.width, newGameObject.x));
    newGameObject.y = Math.max(0, Math.min(500 - newGameObject.height, newGameObject.y));

    return newGameObject;
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, gameObject: GameObject, character: HTMLImageElement | null) => {
    const canvas = ctx.canvas;
    
    // Draw space background
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = Math.sin(i * 234.5) * canvas.width;
      const y = Math.cos(i * 123.4) * canvas.height;
      ctx.fillRect(Math.abs(x), Math.abs(y) % canvas.height, 2, 2);
    }

    // Draw platforms with space station look
    PLATFORMS.forEach((platform) => {
      // Platform base
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Platform detail
      ctx.fillStyle = '#718096';
      for (let i = 0; i < platform.width; i += 20) {
        ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
      }
    });

    // Draw character with trail effect
    if (character) {
      // Trail effect
      ctx.globalAlpha = 0.3;
      ctx.drawImage(
        character,
        gameObject.x - 5,
        gameObject.y,
        gameObject.width,
        gameObject.height
      );
      ctx.globalAlpha = 0.2;
      ctx.drawImage(
        character,
        gameObject.x - 10,
        gameObject.y,
        gameObject.width,
        gameObject.height
      );
      ctx.globalAlpha = 1;
      ctx.drawImage(
        character,
        gameObject.x,
        gameObject.y,
        gameObject.width,
        gameObject.height
      );
    } else {
      // Default character with trail
      ctx.fillStyle = '#60a5fa';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        gameObject.x - 5,
        gameObject.y,
        gameObject.width,
        gameObject.height
      );
      ctx.globalAlpha = 0.2;
      ctx.fillRect(
        gameObject.x - 10,
        gameObject.y,
        gameObject.width,
        gameObject.height
      );
      ctx.globalAlpha = 1;
      ctx.fillRect(
        gameObject.x,
        gameObject.y,
        gameObject.width,
        gameObject.height
      );
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update game state
      gameObjectRef.current = updateGameObject(gameObjectRef.current, keys);
      
      // Render game
      renderGame(ctx, gameObjectRef.current, character);
      
      // Request next frame
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [keys, character, updateGameObject, renderGame]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="border-2 border-gray-300 rounded-lg"
        />
        {!character && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
            <p className="text-xl">Upload a character image to start playing!</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
          <Upload size={20} />
          Upload Character
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        <div className="text-gray-600">
          <p>Controls:</p>
          <p>← → to move in space</p>
          <p>Hold Space to jump higher</p>
        </div>
      </div>
    </div>
  );
}