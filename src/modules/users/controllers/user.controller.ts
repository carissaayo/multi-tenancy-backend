import { Controller, Body, Req, Param, Patch, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { UsersService } from '../services/user.service';
import { UpdateUserDto } from '../dtos/user.dto';
import { AllowUnverified } from 'src/core/security/decorators/allow-unverified.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Update user
  @Patch('')
  @AllowUnverified()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User has been updated successfully',
  })
  updateUser(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req, updateUserDto);
  }

  // Get user
  @Get('')
  @AllowUnverified()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user' })
  @ApiResponse({
    status: 200,
    description: 'User has been retrieved successfully',
  })
  getUser(@Req() req: AuthenticatedRequest) {
    return this.usersService.getUser(req);
  }
}
