import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VideoService } from './video.service';
import { videoProviders } from './videos.providers';
@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [VideoService, ...videoProviders],
  exports: [VideoService],
})
export class VideoModule {}
