import {
  Controller,
  Get,
  Param,
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
  async uploadVideo(@UploadedFiles() videos: Express.Multer.File[]) {
    if (!videos || videos.length === 0) {
      return {
        message: 'Nenhum arquivo de vídeo recebido',
        status: 400,
      };
    }

    const id = await this.gestaoVideoService.videoIngestion(videos);
    return {
      message: 'Upload sendo processado',
      status: 200,
      id,
    };
  }

  @Get('verify/status/upload/:id')
  async get(@Param('id') id: string) {
    return this.gestaoVideoService.findByIdVideo(id);
  }
}
