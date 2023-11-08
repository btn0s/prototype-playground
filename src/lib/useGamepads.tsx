import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Navigator {
    getGamepads(): Gamepad[] | null;
    webkitGetGamepads(): Gamepad[] | null;
  }
}

export interface GamepadRef {
  [key: number]: Gamepad;
}

export default function useGamepads(callback: (data: GamepadRef) => void) {
  const gamepads = useRef<GamepadRef>({});
  const requestRef = useRef<number>();

  const haveEvents = 'ongamepadconnected' in window;

  const updateGamepads = useCallback(
    (gamepad: Gamepad) => {
      gamepads.current[gamepad.index] = gamepad;
      callback({ ...gamepads.current });
    },
    [callback]
  );

  const removeGamepad = useCallback(
    (index: number) => {
      delete gamepads.current[index];
      callback({ ...gamepads.current });
    },
    [callback]
  );

  const connectGamepadHandler = useCallback(
    (e: GamepadEvent) => {
      updateGamepads(e.gamepad);
    },
    [updateGamepads]
  );

  const disconnectGamepadHandler = useCallback(
    (e: GamepadEvent) => {
      removeGamepad(e.gamepad.index);
    },
    [removeGamepad]
  );

  const scanGamepads = useCallback(() => {
    const detectedGamepads = (
      navigator.getGamepads ? navigator.getGamepads() : []
    ) as Gamepad[];
    for (const gamepad of detectedGamepads) {
      if (gamepad) {
        updateGamepads(gamepad);
      }
    }
  }, [updateGamepads]);

  useEffect(() => {
    if (haveEvents) {
      window.addEventListener('gamepadconnected', connectGamepadHandler);
      window.addEventListener('gamepaddisconnected', disconnectGamepadHandler);
    } else {
      scanGamepads();
    }

    return () => {
      window.removeEventListener('gamepadconnected', connectGamepadHandler);
      window.removeEventListener(
        'gamepaddisconnected',
        disconnectGamepadHandler
      );
      cancelAnimationFrame(requestRef.current!);
    };
  }, [
    haveEvents,
    connectGamepadHandler,
    disconnectGamepadHandler,
    scanGamepads,
  ]);

  useEffect(() => {
    if (!haveEvents) {
      const animate = () => {
        scanGamepads();
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current!);
    }
  }, [haveEvents, scanGamepads]);

  return gamepads.current;
}
