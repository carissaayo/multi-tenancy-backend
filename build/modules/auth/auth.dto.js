"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectWorkspaceDTO = exports.ChangePasswordDTO = exports.ResetPasswordDTO = exports.RequestResetPasswordDTO = exports.VerifyEmailDTO = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const matches_property_1 = require("../../core/validators/matches-property");
class RegisterDto {
    fullName;
    phoneNumber;
    email;
    password;
    confirmPassword;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full Name is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+2348012345678' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone Number is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', minLength: 6 }),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123' }),
    (0, matches_property_1.MatchesProperty)('password', { message: 'Passwords do not match' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Please confirm your password' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "confirmPassword", void 0);
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class VerifyEmailDTO {
    emailCode;
}
exports.VerifyEmailDTO = VerifyEmailDTO;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Please enter the verification code' }),
    __metadata("design:type", String)
], VerifyEmailDTO.prototype, "emailCode", void 0);
class RequestResetPasswordDTO {
    email;
}
exports.RequestResetPasswordDTO = RequestResetPasswordDTO;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], RequestResetPasswordDTO.prototype, "email", void 0);
class ResetPasswordDTO {
    email;
    passwordResetCode;
    newPassword;
    confirmNewPassword;
}
exports.ResetPasswordDTO = ResetPasswordDTO;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], ResetPasswordDTO.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '654321' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password Reset code is required' }),
    __metadata("design:type", String)
], ResetPasswordDTO.prototype, "passwordResetCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'newPassword123', minLength: 6 }),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    __metadata("design:type", String)
], ResetPasswordDTO.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'newPassword123' }),
    (0, matches_property_1.MatchesProperty)('newPassword', { message: 'Passwords do not match' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Please confirm your password' }),
    __metadata("design:type", String)
], ResetPasswordDTO.prototype, "confirmNewPassword", void 0);
class ChangePasswordDTO {
    password;
    newPassword;
    confirmNewPassword;
}
exports.ChangePasswordDTO = ChangePasswordDTO;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'oldPassword123' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Current password is required' }),
    __metadata("design:type", String)
], ChangePasswordDTO.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'newPassword123', minLength: 6 }),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'New password is required' }),
    __metadata("design:type", String)
], ChangePasswordDTO.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'newPassword123' }),
    (0, matches_property_1.MatchesProperty)('newPassword', { message: 'Passwords do not match' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Please confirm your new password' }),
    __metadata("design:type", String)
], ChangePasswordDTO.prototype, "confirmNewPassword", void 0);
class SelectWorkspaceDTO {
    workspaceId;
}
exports.SelectWorkspaceDTO = SelectWorkspaceDTO;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '4872fe39-d206-4108-b705-77cff45ab63e',
        description: 'Valid UUID v4 format',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'Workspace ID must be a valid UUID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Workspace ID is required' }),
    __metadata("design:type", String)
], SelectWorkspaceDTO.prototype, "workspaceId", void 0);
//# sourceMappingURL=auth.dto.js.map