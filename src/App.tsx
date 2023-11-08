import { useCallback, useEffect, useState } from 'react';
import useBackbone, {
  ButtonType,
  InputType,
  JoystickDirection,
} from './lib/useBackbone.tsx';

export default function App() {
  const backbone = useBackbone();

  const [selectedMenuOption, setSelectedMenuOption] = useState(0);

  const incrementSelectedMenuOption = () => {
    setSelectedMenuOption((prev) => {
      console.log(prev);
      if (prev === 4) {
        return 4;
      }
      debugger;
      return prev + 1;
    });
  };

  const decrementSelectedMenuOption = () => {
    setSelectedMenuOption((prev) => {
      console.log(prev);
      if (prev === 0) {
        return 0;
      }
      return prev - 1;
    });
  };

  const handleSelectMenuOption = useCallback(() => {
    console.log('selected menu option', selectedMenuOption);
  }, [selectedMenuOption]);

  useEffect(() => {
    backbone.onInput(ButtonType.A, InputType.Press, handleSelectMenuOption);
    backbone.onInput(
      JoystickDirection.LeftDown,
      InputType.Press,
      incrementSelectedMenuOption
    );
    backbone.onInput(
      JoystickDirection.LeftUp,
      InputType.Press,
      decrementSelectedMenuOption
    );
    backbone.onInput(
      ButtonType.DPadDown,
      InputType.Press,
      incrementSelectedMenuOption
    );
    backbone.onInput(
      ButtonType.DPadUp,
      InputType.Press,
      decrementSelectedMenuOption
    );
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`text-2xl font-bold ${
              selectedMenuOption === i ? 'underline' : ''
            }`}
          >
            Menu Option {i}
          </div>
        ))}
      </div>
    </div>
  );
}
