import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Aumentar límite del body parser para imágenes base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Servir archivos estáticos desde la carpeta uploads
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: '*', // En producción, especificar los dominios permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Puerto 3001 para no conflicto con el servicio de reconocimiento facial (3000)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
