import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { UpdateSettingsDto } from './dto';
import * as net from 'net';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { user_id: userId },
      });
    }

    // Mask sensitive values
    return {
      ...settings,
      openai_api_key: settings.openai_api_key
        ? this.maskApiKey(this.encryption.decrypt(settings.openai_api_key))
        : null,
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    // Ensure settings record exists
    const existing = await this.prisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    const data: Record<string, unknown> = { ...dto };

    // Encrypt sensitive fields
    if (dto.openai_api_key !== undefined) {
      if (dto.openai_api_key === '') {
        data.openai_api_key = null;
      } else if (!dto.openai_api_key.startsWith('sk-***')) {
        // Only update if not masked value
        data.openai_api_key = this.encryption.encrypt(dto.openai_api_key);
      } else {
        // Masked value sent back — don't update
        delete data.openai_api_key;
      }
    }

    if (!existing) {
      const settings = await this.prisma.userSettings.create({
        data: { user_id: userId, ...data } as any,
      });
      return this.maskSettingsResponse(settings);
    }

    const settings = await this.prisma.userSettings.update({
      where: { user_id: userId },
      data: data as any,
    });

    return this.maskSettingsResponse(settings);
  }

  async testSmtp(host: string, port: number, username: string, password: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const timeout = 10000;
      const socket = new net.Socket();

      const timer = setTimeout(() => {
        socket.destroy();
        resolve({ success: false, message: 'Тайм-аут подключения к SMTP серверу' });
      }, timeout);

      socket.connect(port, host, () => {
        clearTimeout(timer);
        socket.destroy();
        resolve({ success: true, message: `Подключение к ${host}:${port} успешно` });
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        socket.destroy();
        resolve({ success: false, message: `Ошибка подключения: ${err.message}` });
      });
    });
  }

  async testOpenai(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'API ключ OpenAI валиден' };
      }

      const body = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Ошибка OpenAI: ${(body as any)?.error?.message || response.statusText}`,
      };
    } catch (err) {
      return {
        success: false,
        message: `Ошибка подключения к OpenAI: ${(err as Error).message}`,
      };
    }
  }

  private maskApiKey(key: string): string {
    if (key.length <= 8) return '***';
    return key.slice(0, 5) + '***' + key.slice(-4);
  }

  private maskSettingsResponse(settings: any) {
    return {
      ...settings,
      openai_api_key: settings.openai_api_key
        ? this.maskApiKey(this.encryption.decrypt(settings.openai_api_key))
        : null,
    };
  }
}
