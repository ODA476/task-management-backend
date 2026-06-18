import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    .addBearerAuth() // 🔑 Tells Swagger that we use JWT Bearer tokens for protection
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // This sets up the documentation endpoint at http://localhost:3000/api
  SwaggerModule.setup('docs', app, document);
  // ----------------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
