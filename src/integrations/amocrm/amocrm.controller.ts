import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AmoCrmService } from './amocrm.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('integrations/amocrm')
@UseGuards(JwtAuthGuard)
export class AmoCrmController {
  constructor(private readonly amoCrmService: AmoCrmService) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async connect(@Req() req: Request, @Body() body: { domain: string }) {
    const user = req.user as { id: string };
    const redirectUrl = this.amoCrmService.getOAuthUrl(body.domain, user.id);
    return { data: { redirect_url: redirectUrl } };
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async callback(
    @Req() req: Request,
    @Body() body: { code: string; domain: string },
  ) {
    const user = req.user as { id: string };
    const integration = await this.amoCrmService.handleCallback(
      user.id,
      body.code,
      body.domain,
    );
    return { data: integration };
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync(@Req() req: Request) {
    const user = req.user as { id: string };
    const result = await this.amoCrmService.syncLeads(user.id);
    return { data: result };
  }

  @Delete('disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(@Req() req: Request) {
    const user = req.user as { id: string };
    await this.amoCrmService.disconnect(user.id);
  }

  @Get('status')
  async status(@Req() req: Request) {
    const user = req.user as { id: string };
    const connectionStatus = await this.amoCrmService.getStatus(user.id);
    return { data: connectionStatus };
  }
}
