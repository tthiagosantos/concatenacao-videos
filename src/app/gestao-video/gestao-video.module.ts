import { Module } from '@nestjs/common';
import { GestaoVideoService } from './gestao-video.service';
import { GestaoVideoController } from './gestao-video.controller';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [VideoModule],
  controllers: [GestaoVideoController],
  providers: [GestaoVideoService],
})
export class GestaoVideoModule {}
