# 🧪 Guía de Ejecución de Tests - Gym Management Backend

Esta guía te ayudará a ejecutar y verificar las pruebas del sistema.

---

## 📋 Requisitos Previos

```bash
# Verificar que las dependencias estén instaladas
cd gym-mfbackend
npm install
```

---

## 🚀 Comandos de Testing

### 1️⃣ Ejecutar Todos los Tests

```bash
npm run test
```

**Salida esperada:**
```
PASS src/miembros/miembros.service.spec.ts
PASS src/miembros/miembros.controller.spec.ts
PASS src/membresias/membresias.service.spec.ts
PASS src/deudas/deudas.service.spec.ts
PASS src/asistencias/asistencias.service.spec.ts
PASS src/dashboard/dashboard.service.spec.ts

Test Suites: 6 passed, 6 total
Tests:       55 passed, 55 total
```

---

### 2️⃣ Ejecutar Tests con Cobertura

```bash
npm run test:cov
```

Esto generará un reporte de cobertura en `coverage/lcov-report/index.html`

**Métricas objetivo:**
- ✅ Statements: ≥ 80%
- ✅ Branches: ≥ 75%
- ✅ Functions: ≥ 80%
- ✅ Lines: ≥ 80%

---

### 3️⃣ Modo Watch (Desarrollo)

```bash
npm run test:watch
```

Útil durante el desarrollo: los tests se re-ejecutan automáticamente al guardar cambios.

---

### 4️⃣ Ejecutar Test Específico

```bash
# Test de un módulo específico
npm run test -- miembros.service.spec.ts

# Test de un describe específico
npm run test -- -t "MiembrosService"

# Test de un caso específico
npm run test -- -t "debe crear un miembro"
```

---

## 📊 Resumen de Tests Implementados

| Módulo | Archivo | Tests | Casos Cubiertos |
|--------|---------|-------|-----------------|
| **Miembros Controller** | `miembros.controller.spec.ts` | 10 | ✅ POST, GET, GET/:id, PUT, DELETE |
| **Miembros Service** | `miembros.service.spec.ts` | 12 | ✅ CRUD, búsqueda, soft delete |
| **Membresías Service** | `membresias.service.spec.ts` | 7 | ✅ Creación, fechas, por vencer |
| **Deudas Service** | `deudas.service.spec.ts` | 9 | ✅ Crear, abonar, estados |
| **Asistencias Service** | `asistencias.service.spec.ts` | 7 | ✅ Check-in/out, estadísticas |
| **Dashboard Service** | `dashboard.service.spec.ts` | 3 | ✅ Métricas, top miembros |
| **TOTAL** | **6 archivos** | **48+** | **28 endpoints** |

---

## 🔍 Casos de Prueba Principales

### Miembros
- ✅ Crear miembro sin membresía
- ✅ Crear miembro con membresía completa
- ✅ Crear miembro con deuda parcial
- ✅ Generación de código único (GYM-0001, GYM-0002...)
- ✅ Búsqueda por nombre/cédula/código
- ✅ Soft delete (desactivación)

### Membresías
- ✅ Cálculo automático de fechas
- ✅ Membresías por vencer (7 días)
- ✅ Membresías vencidas
- ✅ Estado activa/vencida

### Deudas
- ✅ Creación con estado pendiente/parcial
- ✅ Abonar y actualizar estado
- ✅ Cambio automático a "pagada"
- ✅ Cálculo de montoPendiente

### Asistencias
- ✅ Check-in de miembro
- ✅ Check-out con cálculo de duración
- ✅ Validación de check-in activo
- ✅ Miembros actualmente en gym

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
npm ci
```

### Error: "Connection timeout"
```bash
# Los tests NO requieren conexión a base de datos
# Usan mocks de TypeORM
```

### Tests fallan aleatoriamente
```bash
# Ejecutar tests en modo secuencial
npm run test -- --runInBand
```

---

## ✅ Checklist de Verificación

Antes de hacer commit:

- [ ] Todos los tests pasan (`npm run test`)
- [ ] Cobertura ≥ 80% (`npm run test:cov`)
- [ ] No hay warnings o errores
- [ ] Tests son deterministas (no fallan aleatoriamente)
- [ ] Mocks están correctamente configurados

---

## 📈 Próximos Pasos

1. **Tests faltantes:**
   - Controllers de Membresías, Deudas, Planes, Pagos, Asistencias, Dashboard
   - Tests E2E con Supertest

2. **Mejoras:**
   - Agregar tests de integración
   - Configurar CI/CD para ejecución automática
   - Agregar tests de carga

---

## 📚 Documentos Relacionados

- [Plan de Pruebas Completo](./test-plan.md) - Estrategia y casos de prueba
- [Documentación NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

**Última actualización:** 2025-12-20  
**Autor:** Sistema de Gestión de Gimnasio
