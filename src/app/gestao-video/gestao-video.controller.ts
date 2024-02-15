import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GestaoVideoService } from './gestao-video.service';

@Controller('gestao-video')
export class GestaoVideoController {
  constructor(private readonly gestaoVideoService: GestaoVideoService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('videos'))
  uploadVideo(@UploadedFiles() videos: Express.Multer.File[]) {
    if (!videos || videos.length === 0) {
      return {
        message: 'Nenhum arquivo de vídeo recebido',
        status: 400,
      };
    }

    this.gestaoVideoService.videoIngestion(videos);
    return {
      message: 'Upload realizado com sucesso',
      status: 200,
    };
  }
}
