import { Module } from '@nestjs/common';
import { BookDemoController } from './book-demo.controller';
import { BookDemoService } from './book-demo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BookDemoController],
  providers: [BookDemoService],
})
export class BookDemoModule {}

