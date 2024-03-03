import { Document } from 'mongoose';

export interface Video extends Document {
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  size: number;
  status: string;
  url: string;
}
