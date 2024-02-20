import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Video } from './interface/video.interface';
import { writeFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class VideoService {
  private logger = new Logger(VideoService.name);
  private videosDirectory: string;
  private outputDirectory = path.resolve(__dirname, '..', '..', 'output');
  private fileListPath = path.resolve(
    __dirname,
    '..',
    '..',
    'temp',
    'files.txt',
  );
  private outputFilePath = path.join(this.outputDirectory, 'output.mp4');

  constructor(@Inject('VIDEO_MODEL') private videoModel: Model<Video>) {
    this.videosDirectory = path.resolve(__dirname, '..', '..', 'videos');
  }

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
      this.logger.log('Merging videos...');
      const videoPaths = await this.saveVideos(videos);
      const videosNames = videoPaths.map((video) => video.name);
      await this.createFileList(videosNames);
      await this.concatVideos();
    } catch (error) {
      this.logger.error('Error merging videos:', error);
      throw new InternalServerErrorException({
        message: 'Error merging videos',
      });
    }
  }

  async createFileList(videoNames: string[]) {
    try {
      await mkdir(path.dirname(this.fileListPath), { recursive: true });
      const fileContents = videoNames
        .map((name) => `file '${path.join(this.videosDirectory, name)}'`)
        .join('\n');
      await writeFile(this.fileListPath, fileContents);
    } catch (error) {
      this.logger.error('Error creating file list:', error);
      throw new InternalServerErrorException({
        message: 'Error creating file list',
      });
    }
  }

  async concatVideos() {
    try {
      await mkdir(this.outputDirectory, { recursive: true });
      const command = `ffmpeg -f concat -safe 0 -i ${this.fileListPath} -c copy ${this.outputFilePath}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error('Error concatenating videos:', error);
          throw new InternalServerErrorException({
            message: 'Error concatenating videos',
          });
        }
        this.logger.log('Videos concatenated successfully.');
      });
    } catch (error) {
      this.logger.error('Error concatenating videos:', error);
      throw new InternalServerErrorException({
        message: 'Error concatenating videos',
      });
    }
  }

  async saveVideos(videos: Express.Multer.File[]) {
    try {
      const savedVideoPaths = [];

      try {
        await mkdir(this.videosDirectory, { recursive: true });
      } catch (mkdirError) {
        if (mkdirError.code !== 'EEXIST') {
          throw mkdirError;
        }
      }

      for (const video of videos) {
        const filePath = path.join(this.videosDirectory, video.originalname);
        await writeFile(filePath, video.buffer);
        savedVideoPaths.push({ filePath, name: video.originalname });
      }

      return savedVideoPaths;
    } catch (error) {
      this.logger.error('Error saving videos:', error);
      throw new InternalServerErrorException({
        message: 'Error saving videos',
      });
    }
  }

  async destroyVideos(pathVideos: string[]) {
    try {
      for (const pathVideo of pathVideos) {
        await fs.promises.unlink(pathVideo);
        this.logger.log(`Video ${pathVideo} deleted successfully.`);
      }
    } catch (error) {
      this.logger.error('Error destroying videos:', error);
      throw new InternalServerErrorException({
        message: 'Error destroying videos',
      });
    }
  }
}
