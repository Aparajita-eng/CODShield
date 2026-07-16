import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookDemoService } from './book-demo.service';
import { Public } from '../auth/public.decorator';
import { BookDemoDto } from './dto/book-demo.dto';

@Public()
@Controller('api/book-demo')
export class BookDemoController {
  constructor(private readonly bookDemoService: BookDemoService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async bookDemo(@Body() dto: BookDemoDto) {
    return this.bookDemoService.sendBookingRequest(dto);
  }
}

