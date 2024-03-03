import { Injectable } from '@nestjs/common';
import { VideoService } from '../video/video.service';
@Injectable()
export class GestaoVideoService {
  constructor(private readonly videoService: VideoService) {}
  async videoIngestion(videos: Express.Multer.File[]) {
    const { _id } = await this.saveDetailsVideo({
      duration: 0,
      resolution: { width: 0, height: 0 },
      size: 0,
      status: 'processing',
      url: 'sem acesso',
    });

    setTimeout(() => {
      this.videoService.concatVideo(videos, _id);
    }, 20000);

    return _id;
  }

  async saveDetailsVideo(video: any) {
    return this.videoService.create(video);
  }

  async findByIdVideo(_id: string) {
    return this.videoService.findById(_id);
  }
}
