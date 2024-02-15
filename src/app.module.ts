import { Module } from '@nestjs/common';
import { GestaoVideoModule } from './app/gestao-video/gestao-video.module';
import { DatabaseModule } from './database/database.module';
import { VideoModule } from './app/video/video.module';

@Module({
  imports: [GestaoVideoModule, DatabaseModule, VideoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
