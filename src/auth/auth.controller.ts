import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
// import { GoogleAuthGuard } from './google-auth.guard';
import { AuthCredentialsSignInDto } from './dto/auth-credentials-signin.dto';
import { AuthCredentialsSignUpDto } from './dto/auth-credentials-signup.dto';
import * as Express from 'express';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/auth.entity';
import { GetUser } from './decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current logged in user' })
  @ApiResponse({ status: 200, description: 'User returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@GetUser() user: User): UserResponseDto {
    return new UserResponseDto(user);
  }

  @Post('/signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'The user has been successfully registered.' })
  @ApiConflictResponse({ description: 'The email address provided already exists in the system.' })
  signUp(@Body() authCredentialDto: AuthCredentialsSignUpDto): Promise<void> {
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
  @ApiOperation({ summary: 'Login and receive an HTTP-Only Cookie' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated. Returns a signed JSON Web Token (JWT).',
    schema: { example: { accessToken: 'eyJhbGciOiJIUzI1Ni...' } },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid login credentials provided.' })
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsSignInDto,
    @Res({ passthrough: true }) res: Express.Response,
  ) {
    const { accessToken } = await this.authService.signIn(authCredentialsDto);

    // Set cookie headers directly onto client response window
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Prevents cross-site scripting (XSS) access to token
      secure: false, // Set to true in production deployment when using HTTPS
      sameSite: 'lax', // Protects against cross-site request forgery (CSRF)
      maxAge: 3600000, // Token lifetime configuration rule (1 Hour)
    });

    return { message: 'Logged in successfully' };
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

  // @Get('/google/login')
  // @UseGuards(GoogleAuthGuard)
  // googleLogin() {}

  // @Get('/google/callback')
  // @UseGuards(GoogleAuthGuard)
  // async googleCallback(@Req() req, @Res() res) {
  //   const response = await this.authService.signIn({ email: req.user.email, password: ''});
  //   res.redirect(`http://localhost:5173?token=${response.accessToken}`);

  //   // const accessToken = req.user?.accessToken;
  //   // return { accessToken };
  // }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear auth cookies and log user out' })
  logout(@Res({ passthrough: true }) res: Express.Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
