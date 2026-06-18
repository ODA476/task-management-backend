import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/auth.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }

    super({
      // Tell Passport how to extract the JWT from the request headers
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Must match the secret key used in AuthModule
      secretOrKey: jwtSecret,
    });
  }

  // If the signature is valid, passport passes the decoded payload here
  async validate(payload: { email: string; sub: string }): Promise<User> {
    const { email } = payload;
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException('User not found or session invalid');
    }

    // Crucial: Whatever is returned here is injected automatically into the Request object!
    // It becomes accessible via request.user
    return user;
  }
}
