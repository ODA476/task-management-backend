import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// import { MailerModule } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/auth.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import googleOauthConfig from './config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
// import { MailtrapTransport } from 'mailtrap';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ConfigModule.forFeature(googleOauthConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Reads from .env
        signOptions: {
          expiresIn: 3600,
        },
      }),
    }),
    TypeOrmModule.forFeature([User]),

    // Configure the Mailer model
    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     transport: {
    //       host: configService.get('MAIL_HOST'),
    //       port: configService.get('MAIL_PORT'),
    //       auth: {
    //         user: configService.get('MAIL_USER'),
    //         pass: configService.get('MAIL_PASS'),
    //       },
    //     },
    //     defaults: {
    //       from: '"Task Manager Admin" <noreply@planio.dev>',
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),

    ////--------------------------------------------
    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     transport: MailtrapTransport({
    //       token: configService.get<string>('MAIL_TOKEN')!,
    //     }),
    //     defaults: {
    //       from: {
    //         name: configService.get<string>('MAIL_FROM_NAME', 'Task Manager Admin'),
    //         address: configService.get<string>('MAIL_FROM_ADDRESS', 'noreply@taskmanager.com'),
    //       },
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
