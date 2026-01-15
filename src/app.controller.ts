import { Controller, Get, Head } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'multi-tenancy-backend',
      uptime: process.uptime(),
    };
  }

  @Head()
  headRoot() {
    return;
  }
}
