import 'react-day-picker';

declare module 'react-day-picker' {
  export interface CustomComponents {
    IconLeft?: React.ComponentType<React.ComponentProps<'svg'>>;
    IconRight?: React.ComponentType<React.ComponentProps<'svg'>>;
  }
} 