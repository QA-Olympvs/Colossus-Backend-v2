# Testing Guide - Colossus Backend v2

Este proyecto utiliza **Vitest** para tests unitarios y E2E, con **SWC** para compilación rápida de TypeScript.

## 📋 Scripts disponibles

```bash
# Tests unitarios
npm test                 # Ejecutar tests una vez
npm run test:watch       # Modo watch (re-ejecuta al cambiar archivos)
npm run test:cov         # Ejecutar con coverage report
npm run test:debug       # Debug con inspector

# Tests E2E
npm run test:e2e         # Ejecutar tests E2E
```

## 🧪 Estructura de Tests

### Tests Unitarios
Los tests unitarios van junto al archivo fuente:

```
src/
  users/
    users.service.ts
    users.service.spec.ts    ← Test del servicio
    users.controller.ts
    users.controller.spec.ts ← Test del controlador
```

### Tests E2E
Los tests E2E van en la carpeta `test/`:

```
test/
  setup-e2e.ts          ← Configuración global E2E
  app.e2e-spec.ts       ← Tests E2E de la app
  auth.e2e-spec.ts      ← Tests E2E de autenticación
```

## 📝 Patrones de Testing

### Testing de Servicios con Repositorio Mockeado
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MyService } from './my.service';
import { MyEntity } from './entities/my.entity';

describe('MyService', () => {
  let service: MyService;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: getRepositoryToken(MyEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should find entity by id', async () => {
    const mockEntity = { id: '1', name: 'Test' };
    repository.findOne.mockResolvedValue(mockEntity);

    const result = await service.findOne('1');

    expect(result).toEqual(mockEntity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

### Testing de Controladores
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MyController } from './my.controller';
import { MyService } from './my.service';

describe('MyController', () => {
  let controller: MyController;
  let service: any;

  beforeEach(async () => {
    service = {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        { provide: MyService, useValue: service },
      ],
    }).compile();

    controller = module.get<MyController>(MyController);
  });

  it('should return all items', async () => {
    const mockItems = [{ id: '1', name: 'Test' }];
    service.findAll.mockResolvedValue(mockItems);

    const result = await controller.findAll();

    expect(result).toEqual(mockItems);
  });
});
```

### Testing E2E
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/resource (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/resource')
      .expect(200);
    
    expect(response.body).toBeDefined();
  });
});
```

## 🔧 Configuración

### Vitest Unitario (`vitest.config.ts`)
- **Compilador**: SWC (unplugin-swc) - 20x más rápido que ts-jest
- **Globals**: Habilitados para APIs como `describe`, `it`, `expect`
- **Coverage**: v8 provider con reportes text, HTML y lcov
- **Include**: `src/**/*.spec.ts`

### Vitest E2E (`vitest.config.e2e.ts`)
- **Setup**: `./test/setup-e2e.ts` para configuración global
- **Include**: `test/**/*.e2e-spec.ts`
- **Environment**: node (no necesita jsdom)

## 🎯 Cobertura

El reporte de cobertura se genera en:
- Terminal (resumen)
- `coverage/` (HTML detallado)
- `coverage/lcov.info` (para integración con CI)

Excluye automáticamente:
- DTOs (`**/*.dto.ts`)
- Entidades (`**/*.entity.ts`)
- Configuración y tests

## 🗄️ Testing con Base de Datos

### Opción 1: Repository Mocking (Recomendado para unit tests)
Mock del repositorio de TypeORM - rápido y aislado.

### Opción 2: SQLite en memoria (Para integración ligera)
```typescript
// Configurar TypeORM para testing
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
})
```

### Opción 3: Testcontainers (Para E2E real)
Usar contenedores PostgreSQL para tests E2E que requieren BD real.

## 💡 Tips

1. **Mocking**: Usa `vi.fn()` de Vitest en lugar de `jest.fn()`
2. **Async**: Tests async con `async/await`
3. **Exceptions**: Usa `rejects.toThrow()` para testing de errores
4. **Modules**: Asegúrate de compilar el módulo con `.compile()`
5. **Cleanup**: Cierra la app con `app.close()` en tests E2E
6. **Spy**: Usa `vi.spyOn()` para espiar métodos existentes

```typescript
// Ejemplo de spy
const spy = vi.spyOn(service, 'findOne').mockResolvedValue(mockUser);
expect(spy).toHaveBeenCalledWith('123');
```

## 🚀 Migración desde Jest

Si vienes de Jest, los cambios principales son:

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.mock()` | `vi.mock()` |
| `beforeAll`/`afterAll` | Igual - vienen de Vitest |
| `ts-jest` | `unplugin-swc` (mucho más rápido) |

## 📊 Performance

Comparativa de ejecución:
- **Jest + ts-jest**: ~30s
- **Vitest + SWC**: ~3s ⚡

Mejora de **10x** en tiempo de ejecución de tests.

## 🔍 Debugging

```bash
# Debug con Node inspector
npm run test:debug

# O con watch mode
npm run test:watch -- --reporter=verbose
```
