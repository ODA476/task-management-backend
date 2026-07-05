import { BadRequestException, Body, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/auth.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthCredentialsSignInDto } from './dto/auth-credentials-signin.dto';
import { AuthCredentialsSignUpDto } from './dto/auth-credentials-signup.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // Registration flow
  async signUp(authCredentialsDto: AuthCredentialsSignUpDto): Promise<void> {
    const { email, password, firstName, lastName } = authCredentialsDto;

    // 1. Generate salt and hash the plaintext password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // 2. Instantiate user entity with the hashed password
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isConfirmed: false,
      confirmationToken,
    });

    try {
      await this.userRepository.save(user);

      // MOCK EMAIL DELIVERY: Log verification link to your terminal console
      // console.log('\n=== ✉️ EMAIL CONFIRMATION LINK ===');
      // console.log(`http://localhost:3000/auth/confirm?token=${confirmationToken}`);
      // console.log('===================================\n');

      await this.mailService.sendMail(
        email,
        'Verify Your Email',
        'verify-email', // verify-email.hbs
        {
          name: user.firstName,
          verificationLink: `http://localhost:3000/auth/confirm?token=${confirmationToken}`,
          expiresIn: '24 hours',
          currentYear: new Date().getFullYear(),
        },
      );
    } catch (error) {
      // PostgreSQL error code '23505' stands for unique_violation (duplicate email)
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  // CONFIRM EMAIL ACTION
  async confirmEmail(token: string): Promise<string> {
    const user = await this.userRepository.findOneBy({ confirmationToken: token });

    if (!user) {
      throw new BadRequestException('Invalid or expired confirmation toekn');
    }

    user.isConfirmed = true;
    user.confirmationToken = null; // Clear token after use
    await this.userRepository.save(user);

    return 'Email confirmed successfully! You can now log in.';
  }

  // Sign In
  async signIn(authCredentialsDto: AuthCredentialsSignInDto): Promise<{accessToken: string}> {
    const { email, password } = authCredentialsDto;

    // Fill user by email
    const user = await this.userRepository.findOneBy({ email });

    // Compare plain password with hashed password
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      // Enforcement Boundary: Block unconfirmed users
      if (!user.isConfirmed) {
        throw new UnauthorizedException('Please confirm your email address before logging in.');
      }

      // Create the JWT Payload (do not put sensitive details like passwords here)
      const payload = { email: user.email, sub: user.id };
      // Generate the token string
      const accessToken = await this.jwtService.sign(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }

  // FORGOT PASSWORD ACTION
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const user = await this.userRepository.findOneBy({ email });

    // For security reasons, do not explicitly tell attackers if an email exists or not
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = resetToken;
    // Set expiration deadline to exactly 1 hour from current time
    user.resetPasswordExpires = new Date(Date.now() + 3600000);

    await this.userRepository.save(user);

    // MOCK EMAIL DELIVERY: Log password reset link to your terminal console
    // console.log('\n=== 🔑 PASSWORD RESET LINK ===');
    // console.log(`http://localhost:3000/auth/reset-password?token=${resetToken}`);
    // console.log('================================\n');

    await this.mailService.sendMail(
      email,
      'Reset password',
      'reset-password', // reset-password.hbs
      {
        name: user.firstName,
        resetLink: `http://localhost:3000/auth/reset-password?token=${resetToken}`,
        expiresIn: '60 minutes',
      },
    );
  }

  // RESET PASSWORD EXECUTION
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Look for a user matching the token where expiration time is strictly in the future
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token has expired or is invalid.');
    }

    const expiresTime = user?.resetPasswordExpires ? user.resetPasswordExpires.getTime() : 0;

    if (!user || expiresTime < Date.now()) {
      throw new BadRequestException('Token has expired or is invalid.');
    }

    // Hash and store the new password credentials safely
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear token information fields completely
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }

  async validateGoogleUser(googleUser: AuthCredentialsSignInDto): Promise<any> {
    const { email, password } = googleUser;
    const user = await this.findByEmail(email);

    if (!user) {
      // 1. Generate salt and hash the plaintext password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      // 2. Instantiate user entity with the hashed password
      const user = this.userRepository.create({
        email: email,
        password: hashedPassword,
        isConfirmed: true,
      });
      await this.userRepository.save(user);
    }

    // const payload = { email: user?.email, sub: user?.id };
    // const accessToken = await this.jwtService.sign(payload);

    return user;
    // return { accessToken };
  }
}
