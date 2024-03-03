import * as mongoose from 'mongoose';

export const VideoSchema = new mongoose.Schema({
  duration: Number,
  resolution: {
    width: Number,
    height: Number,
  },
  size: Number,
  status: String,
  url: String,
});
