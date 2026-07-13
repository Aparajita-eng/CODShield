import { Body, Controller, Post } from '@nestjs/common';
import { BookDemoService } from './book-demo.service';

@Controller('api/book-demo')
export class BookDemoController {
  constructor(private readonly bookDemoService: BookDemoService) {}

  @Post()
  async bookDemo(@Body() body: any) {
    return this.bookDemoService.sendBookingRequest(body);
  }
}
