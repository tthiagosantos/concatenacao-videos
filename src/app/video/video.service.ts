import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Video } from './interface/video.interface';
import { resolve, join, dirname } from 'path';
import { writeFile } from 'fs/promises';
import { spawn } from 'child_process';
import { pipeline } from 'stream';
import { promisify } from 'util';

@Injectable()
export class VideoService {
  private logger = new Logger(VideoService.name);

  constructor(@Inject('VIDEO_MODEL') private videoModel: Model<Video>) {}

  async create(video: Video) {
    try {
      const createdVideo = new this.videoModel(video);
      await createdVideo.save();
      this.logger.log('Video saved successfully');
    } catch (e) {
      throw new InternalServerErrorException({ message: e.message });
    }
  }

  async concatVideo(videos: Express.Multer.File[]) {
    try {
      const videoPaths = await this.saveVideos(videos);
      const fileDir = dirname(videoPaths[0]);
      const outputFilePath = join(fileDir, 'video_final.mp4');
      const ffmpegArgs = [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        `concat:${videoPaths.join('|')}`,
        '-c',
        'copy',
        '-fflags',
        '+genpts',
        outputFilePath,
      ];

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      console.log('Merging videos...');

      ffmpegProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        console.error('FFmpeg stderr output:', output);
      });

      ffmpegProcess.on('exit', (code) => {
        console.log('\nFFmpeg process exited with code:', code);
        if (code === 0) {
          console.log('Videos merged successfully:', outputFilePath);
        } else {
          console.error('Error merging videos. Exit code:', code);
          console.error('FFmpeg stderr output:', outputFilePath);
          throw new Error('Error merging videos');
        }
      });

      await new Promise<void>((resolve, reject) => {
        ffmpegProcess.on('error', (error) => {
          console.error('FFmpeg process error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error merging videos:', error);
      throw new InternalServerErrorException({
        message: 'Error merging videos',
      });
    }
  }

  async saveVideos(videos: Express.Multer.File[]) {
    try {
      const savedVideoPaths: string[] = [];

      for (const video of videos) {
        const filePath = resolve(
          dirname(__dirname),
          'video',
          video.originalname,
        );
        await writeFile(filePath, video.buffer);
        savedVideoPaths.push(filePath);
      }

      return savedVideoPaths;
    } catch (error) {
      this.logger.error('An error occurred while saving videos:', error);
      throw new InternalServerErrorException({
        message: 'An error occurred while saving videos',
      });
    }
  }

  async destroyVideos(pathVideos: string[]) {}
}
