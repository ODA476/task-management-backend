import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ENABLE COOKIE PARSING
  app.use(cookieParser());

  app.use(morgan('dev'));

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // --- ENABLE AUTOMATED DATA SERIALIZATION ---
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // --- SWAGGER CONFIGURATION ---
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('The interactive REST API documentation for managing tasks.')
    .setVersion('1.0')
    // .addBearerAuth() // 🔑 Tells Swagger that we use JWT Bearer tokens for protection
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // This sets up the documentation endpoint at http://localhost:3000/api
  SwaggerModule.setup('docs', app, document);
  // ----------------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
