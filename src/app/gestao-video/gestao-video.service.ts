import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { VideoService } from '../video/video.service';
import { Video } from '../video/interface/video.interface';
@Injectable()
export class GestaoVideoService {
  constructor(private readonly videoService: VideoService) {}
  async videoIngestion(videos: Express.Multer.File[]) {
    for (const video of videos) {
      const resulDetails = await this.getVideoDetails(video);
      await this.saveDetailsVideo(resulDetails);
    }

    await this.videoService.concatVideo(videos);
  }

  async getVideoDetails(video: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = `/tmp/${video.originalname}`;

      fs.writeFile(filePath, video.buffer, (err) => {
        if (err) {
          reject(err);
          return;
        }

        ffmpeg.ffprobe(filePath, (ffprobeErr, metadata) => {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Erro ao excluir arquivo temporário:', unlinkErr);
            }
          });

          if (ffprobeErr) {
            reject(ffprobeErr);
          } else {
            resolve({
              duration: metadata.format.duration,
              resolution: {
                width: metadata.streams[0].width,
                height: metadata.streams[0].height,
              },
              size: video.size,
            });
          }
        });
      });
    });
  }
  async saveDetailsVideo(video: Video) {
    await this.videoService.create(video);
  }
}
