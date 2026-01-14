import { Injectable, Logger } from "@nestjs/common";
import { Channel, ChannelEntity } from "../entities/channel.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateChannelDto } from "../dtos/channel.dto";
import { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { User } from "src/modules/users/entities/user.entity";
import { customError } from "src/core/error-handler/custom-errors";

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createChannel(req: AuthenticatedRequest, dto: CreateChannelDto) {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }
  }
}