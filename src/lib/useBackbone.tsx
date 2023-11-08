import { useState, useEffect, useRef, useCallback } from 'react';

export enum ButtonType {
  A = 'A',
  B = 'B',
  X = 'X',
  Y = 'Y',
  R1 = 'R1',
  R2 = 'R2',
  R3 = 'R3',
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  Menu = 'Menu',
  Home = 'Home',
  Capture = 'Capture',
  More = 'More',
  DPadUp = 'DPadUp',
  DPadDown = 'DPadDown',
  DPadLeft = 'DPadLeft',
  DPadRight = 'DPadRight',
}

export enum InputType {
  Press = 'press',
  Release = 'release',
  Hold = 'hold',
}

export enum JoystickDirection {
  LeftUp = 'LeftUp',
  LeftDown = 'LeftDown',
  LeftRight = 'LeftRight',
  LeftLeft = 'LeftLeft',
  RightUp = 'RightUp',
  RightDown = 'RightDown',
  RightRight = 'RightRight',
  RightLeft = 'RightLeft',
}

const HOLD_THRESHOLD = 500;

type ButtonState = {
  pressed: boolean;
  touched: boolean;
};

const BUTTON_DEFAULT_STATE: ButtonState = {
  pressed: false,
  touched: false,
};

type ButtonStates = {
  [key in ButtonType]: ButtonState;
};

type InputCallback = () => void;

interface InputCallbacks {
  [key: string]: InputCallback;
}

type JoystickState = {
  x: number;
  y: number;
  angle: number | null;
};

type JoysticksState = {
  left: JoystickState;
  right: JoystickState;
};

type JoystickDirectionCallbacks = {
  [key in JoystickDirection]?: InputCallback;
};

type BackboneState = {
  buttons: ButtonStates;
  joysticks: JoysticksState;
};

const mapGamepadButtonToButtonType = (
  buttonIndex: number
): ButtonType | undefined => {
  switch (buttonIndex) {
    case 0:
      return ButtonType.A;
    case 1:
      return ButtonType.B;
    case 2:
      return ButtonType.X;
    case 3:
      return ButtonType.Y;
    case 4:
      return ButtonType.L1;
    case 5:
      return ButtonType.R1;
    case 6:
      return ButtonType.L2;
    case 7:
      return ButtonType.R2;
    case 8:
      return ButtonType.Capture;
    case 9:
      return ButtonType.Menu;
    case 10:
      return ButtonType.L3;
    case 11:
      return ButtonType.R3;
    case 12:
      return ButtonType.DPadUp;
    case 13:
      return ButtonType.DPadDown;
    case 14:
      return ButtonType.DPadLeft;
    case 15:
      return ButtonType.DPadRight;
    case 16:
      return ButtonType.Home;
    case 17:
      return ButtonType.More;
  }
  return undefined;
};

const calculateAngle = (x: number, y: number): number | null => {
  if (Math.abs(x).toFixed(1) === '0.0' && Math.abs(y).toFixed(1) === '0.0') {
    return null;
  }

  let angle = Math.atan2(y, x) * (180 / Math.PI);

  if (angle < 0) {
    angle += 360;
  }

  return angle;
};

const useBackbone = () => {
  const [state, setState] = useState<BackboneState>({
    buttons: {
      [ButtonType.A]: BUTTON_DEFAULT_STATE,
      [ButtonType.B]: BUTTON_DEFAULT_STATE,
      [ButtonType.X]: BUTTON_DEFAULT_STATE,
      [ButtonType.Y]: BUTTON_DEFAULT_STATE,
      [ButtonType.R1]: BUTTON_DEFAULT_STATE,
      [ButtonType.R2]: BUTTON_DEFAULT_STATE,
      [ButtonType.R3]: BUTTON_DEFAULT_STATE,
      [ButtonType.L1]: BUTTON_DEFAULT_STATE,
      [ButtonType.L2]: BUTTON_DEFAULT_STATE,
      [ButtonType.L3]: BUTTON_DEFAULT_STATE,
      [ButtonType.Menu]: BUTTON_DEFAULT_STATE,
      [ButtonType.Home]: BUTTON_DEFAULT_STATE,
      [ButtonType.Capture]: BUTTON_DEFAULT_STATE,
      [ButtonType.More]: BUTTON_DEFAULT_STATE,
      [ButtonType.DPadUp]: BUTTON_DEFAULT_STATE,
      [ButtonType.DPadDown]: BUTTON_DEFAULT_STATE,
      [ButtonType.DPadLeft]: BUTTON_DEFAULT_STATE,
      [ButtonType.DPadRight]: BUTTON_DEFAULT_STATE,
    },
    joysticks: {
      left: {
        x: 0,
        y: 0,
        angle: 0,
      },
      right: {
        x: 0,
        y: 0,
        angle: 0,
      },
    },
  });
  const [joystickDirectionCallbacks, setJoystickDirectionCallbacks] =
    useState<JoystickDirectionCallbacks>({});

  const inputCallbacks = useRef<InputCallbacks>({});
  const holdTimers = useRef<{
    [key in ButtonType]?: ReturnType<typeof setTimeout>;
  }>({});

  const handleButtonPress = useCallback(
    (button: GamepadButton, buttonType: ButtonType) => {
      const pressed = button.pressed;

      setState((prevState) => {
        const wasPressed = prevState.buttons[buttonType].pressed;

        // Clear any existing hold timer for this button
        if (holdTimers.current[buttonType]) {
          clearTimeout(holdTimers.current[buttonType]);
          delete holdTimers.current[buttonType];
        }

        const pressKey = `${buttonType}_${InputType.Press}`;
        const releaseKey = `${buttonType}_${InputType.Release}`;
        const holdKey = `${buttonType}_${InputType.Hold}`;

        if (pressed && !wasPressed) {
          inputCallbacks.current[pressKey]?.();

          holdTimers.current[buttonType] = setTimeout(() => {
            inputCallbacks.current[holdKey]?.();
          }, HOLD_THRESHOLD);
        } else if (!pressed && wasPressed) {
          inputCallbacks.current[releaseKey]?.();
        }

        return {
          ...prevState,
          buttons: {
            ...prevState.buttons,
            [buttonType]: { pressed, touched: pressed },
          },
        };
      });
    },
    []
  );

  const handleJoystickDirection = useCallback(
    (joystick: JoystickState, side: 'Left' | 'Right') => {
      const threshold = 0.5;

      if (joystick.x > threshold) {
        joystickDirectionCallbacks[`${side}Right`]?.();
      } else if (joystick.x < -threshold) {
        joystickDirectionCallbacks[`${side}Left`]?.();
      }

      if (joystick.y > threshold) {
        joystickDirectionCallbacks[`${side}Down`]?.();
      } else if (joystick.y < -threshold) {
        joystickDirectionCallbacks[`${side}Up`]?.();
      }
    },
    [joystickDirectionCallbacks]
  );

  const updateJoystickState = useCallback(
    (axes: number[]) => {
      const leftJoystick = {
        x: axes[0],
        y: axes[1],
        angle: calculateAngle(axes[0], axes[1]),
      };
      const rightJoystick = {
        x: axes[2],
        y: axes[3],
        angle: calculateAngle(axes[2], axes[3]),
      };

      // Invoke the direction handlers for each joystick
      handleJoystickDirection(leftJoystick, 'Left');
      handleJoystickDirection(rightJoystick, 'Right');

      // Update the state with the new joystick values
      setState((prevState) => ({
        ...prevState,
        joysticks: {
          left: leftJoystick,
          right: rightJoystick,
        },
      }));
    },
    [handleJoystickDirection] // Make sure to include handleJoystickDirection in the dependency array
  );

  const onInput = useCallback(
    (
      inputIdentifier: ButtonType | JoystickDirection,
      inputType: InputType,
      callback: InputCallback
    ) => {
      if (Object.values(ButtonType).includes(inputIdentifier as ButtonType)) {
        const key = `${inputIdentifier}_${inputType}`;
        inputCallbacks.current[key] = callback;
      } else if (
        Object.values(JoystickDirection).includes(
          inputIdentifier as JoystickDirection
        )
      ) {
        setJoystickDirectionCallbacks((prev) => ({
          ...prev,
          [inputIdentifier]: callback,
        }));
      }
    },
    []
  );

  useEffect(() => {
    const updateGamepadState = () => {
      const gamepads = (
        navigator.getGamepads ? navigator.getGamepads() : []
      ) as Gamepad[];

      gamepads.forEach((gamepad) => {
        if (gamepad) {
          gamepad.buttons.forEach((button, index) => {
            const buttonType = mapGamepadButtonToButtonType(index);
            if (buttonType) {
              handleButtonPress(button, buttonType);
            }
          });
          updateJoystickState([...gamepad.axes]);
        }
      });
    };

    const intervalId = setInterval(updateGamepadState, 100);

    return () => clearInterval(intervalId);
  }, [handleButtonPress, updateJoystickState]);

  return { buttons: state.buttons, joysticks: state.joysticks, onInput };
};

export default useBackbone;
