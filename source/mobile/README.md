# Box Magic - App Android

Aplicación nativa Android para gestionar reservas y horarios del box.

## Stack

- Kotlin 1.9
- Android SDK 34 / Min SDK 26
- Jetpack Compose
- Retrofit (API REST)
- DataStore (almacenamiento tokens)

## Funcionalidades

- **Login** - Autenticación con email/contraseña
- **Horarios** - Ver clases disponibles próximos 14 días
- **Reservas** - Reservar clase, ver mis reservas, cancelar

## Setup

### Requisitos

- Android Studio Hedgehog (2023.1.1) o superior
- JDK 17

### Primera vez

Android Studio descargará automáticamente las dependencias al abrir el proyecto. Si usas línea de comandos:

```bash
cd source/mobile
# Si tienes Gradle instalado, genera el wrapper:
gradle wrapper --gradle-version=8.7
# Luego:
./gradlew build
```

### Configurar API

La URL base de la API está en `RetrofitClient.kt`:

- Producción: `https://gym-api-production-42fa.up.railway.app/api/v1/`
- Para desarrollo local, cambia a `http://10.0.2.2:8080/api/v1/` (emulador → localhost)

### Ejecutar

1. Abrir proyecto en Android Studio
2. Conectar dispositivo o iniciar emulador
3. Run ▶️

## Estructura

```
app/src/main/kotlin/cl/boxmagic/mobile/
├── BoxMagicApp.kt
├── MainActivity.kt
├── data/
│   ├── ApiService.kt      # Endpoints API
│   ├── RetrofitClient.kt
│   └── TokenManager.kt    # DataStore tokens
├── ui/
│   ├── navigation/
│   ├── screens/
│   │   ├── LoginScreen.kt
│   │   ├── ScheduleScreen.kt
│   │   └── BookingsScreen.kt
│   └── theme/
```
