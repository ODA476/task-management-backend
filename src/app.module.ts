import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { AiService } from './ai/ai.service';

@Module({
  imports: [
    // 1. Load the environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Connect to PostgreSQL asynchronously using ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        // Automatically load all database entities we will create later
        autoLoadEntities: true,

        // Automatically updates database schema to match code changes.
        // WARNING: Never use 'synchronize: true' in production! It can wipe data.
        synchronize: true,
      }),
    }),

    TasksModule,

    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AiService],
})
export class AppModule {}
