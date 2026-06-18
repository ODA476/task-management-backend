import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthGuard } from './google-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'The user has been successfully registered.' })
  @ApiConflictResponse({ description: 'The email address provided already exists in the system.' })
  signUp(@Body() authCredentialDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredentialDto);
  }

  @Get('/confirm')
  @ApiOperation({ summary: 'Confirm a user email via a token' })
  @ApiQuery({ name: 'token', description: 'The confirmation token string' })
  confirmEmail(@Query('token') token: string): Promise<string> {
    return this.authService.confirmEmail(token);
  }

  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with existing user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated. Returns a signed JSON Web Token (JWT).',
    schema: { example: { accessToken: 'eyJhbGciOiJIUzI1Ni...' } },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid login credentials provided.' })
  signIn(@Body() authCredentialsDto: AuthCredentialsDto): Promise<{accessToken: string}> {
    return this.authService.signIn(authCredentialsDto);
  }

  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link token' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit new password credentials using a valid reset token' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('/google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res() res) {
    const response = await this.authService.signIn({ email: req.user.email, password: ''} );
    res.redirect(`http://localhost:5173?token=${response.accessToken}`);

    // const accessToken = req.user?.accessToken;
    // return { accessToken };
  }
}
