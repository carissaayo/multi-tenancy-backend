import { Controller, Body, Req, Patch, Get, UseInterceptors, UploadedFile } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from '../services/user.service';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { UpdateUserDto } from '../dtos/user.dto';
import { AllowUnverified } from 'src/core/security/decorators/allow-unverified.decorator';
import { customError } from 'src/core/error-handler/custom-errors';

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

  // Update user avatar
  @Patch('/avatar')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({
    status: 200,
    description: 'User avatar updated successfully',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
      @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw customError.badRequest('No file provided');
    }
    return this.usersService.updateUserAvatar(req, file);
  }
}
