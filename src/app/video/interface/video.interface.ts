import { Document } from 'mongoose';

export interface Video extends Document {
  readonly duration: number;
  readonly resolution: {
    readonly width: number;
    readonly height: number;
  };
  readonly size: number;
}
