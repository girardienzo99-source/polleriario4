# 🍗 POLLERÍA PRO — Sistema de Gestión Gastronómica

**Desarrollador Comercial:** Río Cuarto Web  
**Ámbito y Moneda:** Argentina — Pesos Argentinos (ARS) | Zona Horaria: America/Argentina/Cordoba  
**Caso de Referencia:** Pollería & Rotisería Los Campeones (Río Cuarto, Córdoba)

---

## 📋 Descripción del Proyecto

**POLLERÍA PRO** es una solución web empresarial integral, rápida, moderna y lista para comercializar, diseñada específicamente para el rubro de pollerías, rotiserías, casas de comidas para llevar y venta de pollos asados al spiedo y a la leña.

El sistema está dividido en dos grandes secciones perfectamente interconectadas:

1. **Landing Page Pública de Pedidos Online (`/`):**
   - Diseño gastronómico premium (paleta negro carbón, naranja fuego, rojo carmesí y blanco).
   - Menú interactivo categorizado: Pollos al spiedo, Pollo al horno, Parrilla, Milanesas, Supremas, Papas fritas, Guarniciones, Empanadas, Bebidas y Combos familiares.
   - Selector de porciones / variantes (Entero, Medio, Cuarto).
   - Carrito de compras con cálculo automático de tarifas de delivery según zonas de Río Cuarto o retiro en local.
   - Cupones de descuento promocionales (`CAMPEON10`, `RIOCUARTO`).
   - Finalización de pedido con confirmación en vivo y enlace directo a WhatsApp para notificar a la cocina.
   - Acceso discreto a la administración en `/login`.

2. **Sistema Administrativo Privado (`/admin`):**
   - **Dashboard:** KPIs en vivo, gráfico de facturación semanal, desglose de métodos de cobro, comandas activas y accesos rápidos.
   - **Punto de Venta (POS):** Optimizado para pantallas táctiles y teclado, búsqueda instantánea, cálculo de vuelto en efectivo, tickets comerciales y fiscales.
   - **Gestión de Pedidos:** Multicanal (Web, mostrador, WhatsApp, teléfono), cambios de estado en vivo, asignación de repartidores e impresión de comandas.
   - **Cocina KDS:** Pantalla para tablets en cocina con alertas visuales por demoras (< 20 min verde, > 20 min amarillo, > 30 min rojo).
   - **Producción de Pollos (Spiedo / Horno):** Registro de tandas de cocción, pollos ingresados crudos, tiempo estimado, pollos listos para venta y control de mermas.
   - **Catálogo de Productos:** ABM completo, costos, precios, margen % calculado automáticamente, fotos, estado activo/pausado y exportación a CSV.
   - **Stock e Insumos:** Materias primas (pollo crudo, papas, aceite, condimentos, leña/carbón, envases), alertas de stock mínimo y ajustes documentados.
   - **Recetas de Cocina (BOM):** Fichas técnicas con cálculo de costo exacto y descuento automático de insumos al cocinar o vender.
   - **Listas de Precios:** Actualización masiva por porcentaje de inflación (+10%, +15%, +20%) con redondeo limpio a $100 o $500.
   - **Promociones & Combos:** Constructor de combos familiares, ofertas por día de la semana y canales autorizados.
   - **Caja & Turnos:** Sesiones por cajero, fondo inicial, control de ventas en efectivo vs digitales, retiros y arqueo de cierre con cálculo de diferencias.
   - **Clientes (CRM):** Base de datos de clientes con historial de compras, teléfonos, direcciones frecuentes y condición fiscal.
   - **Proveedores & Compras:** Recepción de mercadería con incremento automático de inventario y costo de reposición.
   - **Gastos Operativos:** Registro de facturas de gas, luz, carbón, bolsas, sueldos y mantenimiento.
   - **Facturación Electrónica ARCA (ex AFIP):** Arquitectura oficial preparada para WSAA y WSFEv1, emisión de Facturas A, B y C, obtención de CAE y código QR oficial según RG 4291/2018.
   - **Informes y Estadísticas:** Reportes de ventas, productos estrella, rendimiento y exportación a Excel / CSV.
   - **Configuración General:** Datos del negocio, horarios de atención, zonas y tarifas de delivery, y restauración de datos demo.

---

## 🛠️ Arquitectura Tecnológica

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS con paleta personalizada gastronómica
- **Iconografía:** Lucide React
- **Base de Datos & Auth:** Supabase PostgreSQL con RLS policies y modo offline / persistente
- **Gráficos Estadísticos:** Recharts
- **Impresión Térmica:** Motor de recibos en 80mm y 58mm (Ticket comercial, Comanda de cocina, Factura ARCA con CAE y QR)
- **Código QR Fiscal:** Librería QRCode oficial para el estándar AFIP/ARCA
- **Efectos de Éxito:** Canvas Confetti

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar o acceder al proyecto
```bash
cd e:\polleria
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copiar `.env.example` a `.env.local`:
```bash
copy .env.example .env.local
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```
La aplicación estará disponible de inmediato en [http://localhost:3000](http://localhost:3000).

### 5. Compilar para producción
```bash
npm run build
npm start
```

---

## 🗄️ Conexión con Supabase

El sistema incluye una capa híbrida inteligente: funciona inmediatamente con datos locales completos (modo demostración persistente) y está preparado para conectarse a Supabase en minutos:

1. Creá un proyecto en [Supabase](https://supabase.com).
2. Abrí el **SQL Editor** de Supabase.
3. Copiá y ejecutá el archivo:
   `supabase/migrations/20261012_init_polleria_pro.sql`
4. Copiá y ejecutá el archivo de datos iniciales:
   `supabase/seed.sql`
5. En tu archivo `.env.local`, agregá tu URL y Anon Key:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

---

## 🧾 Facturación Electrónica ARCA (ex AFIP)

La aplicación implementa la lógica oficial exigida por ARCA:

- **Modo Simulación / Homologación:** Activo por defecto. Permite emitir comprobantes de prueba identificados claramente como "NO FISCAL", generando CAE simulado y el código QR oficial de AFIP según la RG 4291/2018 (`https://www.afip.gob.ar/fe/qr/?p={BASE64}`).
- **Modo Producción:** Al cargar los certificados digitales (`.crt` y `.key`) emitidos desde la web de ARCA y configurar el Punto de Venta electrónico, el sistema se conecta a los endpoints oficiales de WSFEv1.

---

## 👤 Credenciales de Acceso para Pruebas

Para probar rápidamente los distintos roles de usuario en `/login`, podés utilizar los siguientes accesos demostrativos:

| Rol | Correo Demostrativo | Permisos |
| :--- | :--- | :--- |
| **Administrador** | `admin@polleria.com` | Acceso irrestricto a todos los módulos y configuraciones |
| **Encargada** | `encargado@polleria.com` | Pedidos, stock, precios, compras y producción |
| **Cajero** | `cajero@polleria.com` | Punto de Venta (POS), cobros, caja y arqueos |
| **Cocinero** | `cocina@polleria.com` | Pantalla de cocina KDS y tandas de spiedo |
| **Repartidor** | `repartidor@polleria.com` | Gestión y confirmación de pedidos en reparto |

*(Contraseña de prueba para cualquier usuario: `123456`)*

---

## 🧪 Pruebas Automáticas de Reglas de Negocio

El proyecto incluye una suite de pruebas automatizadas que verifican la integridad de las reglas críticas:
```bash
node tests/business-rules.test.cjs
```

Valida:
1. Algoritmo de validación de CUIT módulo 11.
2. Cálculo de márgenes comerciales y costos.
3. Actualización masiva de precios por porcentaje con redondeo en pesos.
4. Descuento exacto de stock de ingredientes por tanda de spiedo.
5. Cálculo de vuelto en efectivo en el POS.
6. Arqueo y cálculo de diferencias en el cierre de caja.
7. Generación de URL y payload base64 para código QR oficial de ARCA.
8. Determinación de comprobantes compatibles según condición fiscal (A, B, C).

---

## 🏢 Contacto y Soporte

Desarrollado comercialmente por **Río Cuarto Web**.  
Río Cuarto, Córdoba, Argentina.
