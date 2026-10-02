export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherKind = 'clear' | 'rain' | 'storm' | 'fog' | 'ash' | 'snow';

export type IsoEnvironmentState = {
  dayPhase: DayPhase;
  weather: WeatherKind;
  weatherIntensity: number;
  ambientIntensity: number;
};

export type IsoPointLight = {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  emissiveVisualId?: string;
};

export function clampEnvironment(state: IsoEnvironmentState): IsoEnvironmentState {
  return {
    ...state,
    weatherIntensity: Math.min(1, Math.max(0, state.weatherIntensity)),
    ambientIntensity: Math.min(1, Math.max(0, state.ambientIntensity)),
  };
}
