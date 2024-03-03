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
import { promisify } from 'util';

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

  constructor(@Inject('VIDEO_MODEL') private videoModel: Model<Video>) {
    this.videosDirectory = path.resolve(__dirname, '..', '..', 'videos');
  }

  async create(video: Video) {
    try {
      const createdVideo = new this.videoModel(video);
      this.logger.log('Video saved successfully');
      return createdVideo.save();
    } catch (e) {
      throw new InternalServerErrorException({ message: e.message });
    }
  }

  async findById(_id: string) {
    const row = await this.videoModel.findById({ _id });
    if (row['status'] === 'processing') {
      return {
        status: row['status'],
      };
    }
    return {
      status: row['status'],
      link_dowload: row['url'],
    };
  }

  async update(
    _id: string,
    video: {
      duration: number;
      width: number;
      height: number;
      size: number;
      url: string;
    },
  ) {
    const resolution = {
      height: video.height,
      width: video.width,
    };
    await this.videoModel.updateOne(
      { _id },
      {
        status: 'finished',
        size: video.size,
        duration: video.duration,
        resolution: resolution,
        url: video.url,
      },
    );
  }

  async concatVideo(videos: Express.Multer.File[], _id: string) {
    try {
      this.logger.log('initial merging videos...');
      const videoPaths = await this.saveVideos(videos);
      const videosNames = videoPaths.map((video) => video.name);
      await this.createFileList(videosNames);
      const { size, resolution, duration } = await this.concatVideos(_id);

      await this.update(_id, {
        duration,
        width: resolution.width,
        height: resolution.height,
        size,
        url: 'www.aquificaolinknoS3.aws.com',
      });
      this.logger.log('finished merging videos...');
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

  async concatVideos(_id: string): Promise<{
    duration: number;
    resolution: { width: number; height: number };
    size: number;
  }> {
    try {
      const outputFilePath = path.join(this.outputDirectory, `${_id}.mp4`);
      await fs.promises.mkdir(this.outputDirectory, { recursive: true });
      const command = `ffmpeg -f concat -safe 0 -i ${this.fileListPath} -c copy ${outputFilePath}`;

      return new Promise((resolve, reject) => {
        exec(command, async (error, stdout, stderr) => {
          if (error) {
            this.logger.error('Error concatenating videos:', error);
            reject(
              new InternalServerErrorException({
                message: 'Error concatenating videos',
              }),
            );
          } else {
            this.logger.log('Videos concatenated successfully.');

            // Obtenha os dados desejados após a concatenação
            const duration = await this.getDuration(outputFilePath);
            const resolution = await this.getResolution(outputFilePath);
            const size = await this.getFileSize(outputFilePath);

            resolve({ duration, resolution, size });
          }
        });
      });
    } catch (error) {
      this.logger.error('Error concatenating videos:', error);
      throw new InternalServerErrorException({
        message: 'Error concatenating videos',
      });
    }
  }

  // Função para obter a duração do arquivo de vídeo
  async getDuration(filePath: string): Promise<number> {
    const getDurationAsync = promisify(exec);
    const { stdout } = await getDurationAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${filePath}`,
    );
    return parseFloat(stdout);
  }

  // Função para obter a resolução do arquivo de vídeo
  async getResolution(
    filePath: string,
  ): Promise<{ width: number; height: number }> {
    const getResolutionAsync = promisify(exec);
    const { stdout } = await getResolutionAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${filePath}`,
    );
    const [width, height] = stdout.split('x').map(Number);
    return { width, height };
  }

  // Função para obter o tamanho do arquivo de vídeo
  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  }
}
