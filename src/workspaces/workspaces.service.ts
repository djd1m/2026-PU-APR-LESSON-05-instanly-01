import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateWorkspaceDto, AddMemberDto } from './dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        owner_id: userId,
        members: {
          create: { user_id: userId, role: 'owner' },
        },
      },
      include: { members: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getStats(userId: string, workspaceId: string) {
    await this.verifyAccess(userId, workspaceId);

    // Get all member user IDs in this workspace
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      select: { user_id: true },
    });
    const memberIds = members.map((m) => m.user_id);

    const [campaignCount, leadCount, repliedCount, totalSent] =
      await Promise.all([
        this.prisma.campaign.count({
          where: { user_id: { in: memberIds } },
        }),
        this.prisma.lead.count({
          where: { user_id: { in: memberIds } },
        }),
        this.prisma.lead.count({
          where: {
            user_id: { in: memberIds },
            status: 'replied',
          },
        }),
        this.prisma.emailMessage.count({
          where: {
            campaign: { user_id: { in: memberIds } },
            status: 'sent',
          },
        }),
      ]);

    return {
      workspace_id: workspaceId,
      campaigns: campaignCount,
      leads: leadCount,
      replies: repliedCount,
      emails_sent: totalSent,
      members: memberIds.length,
    };
  }

  async addMember(
    userId: string,
    workspaceId: string,
    dto: AddMemberDto,
  ) {
    await this.verifyOwner(userId, workspaceId);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found with this email');
    }

    // Check not already a member
    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: targetUser.id,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('User is already a member');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: targetUser.id,
        role: dto.role === 'owner' ? 'owner' : 'member',
      },
    });
  }

  async removeMember(
    userId: string,
    workspaceId: string,
    targetUserId: string,
  ) {
    await this.verifyOwner(userId, workspaceId);

    if (userId === targetUserId) {
      throw new BadRequestException('Cannot remove yourself as owner');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: targetUserId,
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.workspaceMember.delete({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: targetUserId,
        },
      },
    });
  }

  // ── Private helpers ──

  private async verifyAccess(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
    });
    if (!member) {
      throw new ForbiddenException('No access to this workspace');
    }
    return member;
  }

  private async verifyOwner(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, owner_id: userId },
    });
    if (!workspace) {
      throw new ForbiddenException('Only workspace owner can perform this action');
    }
    return workspace;
  }
}
