<!--
Whitepaper La Tanda v2.1 — fuente canónica en español.
Regenerado desde whitepaper.html (latanda-frontend, servido en latanda.online/whitepaper.html) el 2026-10-11 vía pandoc (html → gfm).
NO EDITAR este archivo a menos que sea para sincronizarlo con el HTML canónico publicado.
Las traducciones viven en archivos hermanos: pt-br.md, id.md, etc.
-->

Documento de diseño, no describe el producto operativo. Menciona
componentes no activos (contratos de custodia, módulos de cadena
planeados) y un prototipo EVM ya retirado; La Tanda no custodia fondos
ni otorga crédito.

La Tanda

Whitepaper Tecnico v2.1

Febrero 2026 (actualizado el 11 de octubre de 2026) \| Ray-Banks LLC

## Contenido

- [1. Resumen Ejecutivo](#abstract)
- [2. El Problema](#problem)
- [3. La Solucion](#solution)
- [4. Tecnologia](#technology)
- [5. Tokenomics](#tokenomics)
- [6. Funcionalidades](#features)
- [7. Seguridad](#security)
- [8. La Tanda Chain](#chain)
- [9. Roadmap](#roadmap)
- [10. Equipo y Legal](#team)

# 1. Resumen Ejecutivo

La Tanda es una plataforma Web3 que digitaliza y mejora el sistema
tradicional de tandas (asociaciones rotativas de ahorro y credito)
mediante tecnologia blockchain, democratizando el acceso a servicios
financieros para comunidades desatendidas.

**Mision:** Construir la plataforma financiera Web3 mas accesible del
mundo, combinando la confianza de las tandas tradicionales con la
transparencia y seguridad de blockchain.

1.7B

Personas sin acceso bancario

\$500B+

Mercado de ROSCAs global

Cosmos SDK

Cadena propia (testnet)

200M

LTD de genesis (diseno mainnet)

# 2. El Problema

## 2.1 Exclusion Financiera

Segun el Banco Mundial, 1.7 mil millones de adultos no tienen acceso a
servicios bancarios. En America Latina, el 45% de la poblacion esta
sub-bancarizada, dependiendo de sistemas informales para ahorro y
credito.

## 2.2 Limitaciones de Tandas Tradicionales

- **Confianza:** Dependen de relaciones personales, limitando el alcance
- **Transparencia:** Sin registros verificables de transacciones
- **Escala:** Dificil crecer mas alla de comunidades locales
- **Seguridad:** Riesgo de incumplimiento sin garantias
- **Acceso:** Requieren presencia fisica y coordinacion manual

## 2.3 Barreras de Web3

Las soluciones DeFi existentes son demasiado complejas para usuarios no
tecnicos, con interfaces intimidantes, tarifas de gas impredecibles y
riesgos de seguridad.

# 3. La Solucion: La Tanda

La Tanda combina lo mejor de ambos mundos: la familiaridad y confianza
de las tandas tradicionales con la seguridad, transparencia y alcance
global de blockchain.

## 3.1 Propuesta de Valor

| Caracteristica | Tanda Tradicional      | La Tanda Web3                                                   |
|----------------|------------------------|-----------------------------------------------------------------|
| Alcance        | Local (10-20 personas) | Global (sin limite)                                             |
| Transparencia  | Verbal/papel           | Registro digital compartido con el grupo                        |
| Seguridad      | Confianza personal     | Historial y reputacion visibles (sin garantia ni seguro)        |
| Pagos          | Efectivo/banco         | Efectivo o transferencia entre miembros; La Tanda solo registra |
| Recompensas    | Ninguna                | LTD de testnet (sin valor monetario)                            |

## 3.2 Como Funciona

1.  **Crear/Unirse:** Usuario crea una tanda o se une a una existente
2.  **Aportar:** Cada miembro entrega su aporte (efectivo o
    transferencia) y quien coordina el grupo lo registra en la
    plataforma
3.  **Sorteo:** Sistema de tombola en vivo determina turnos
4.  **Recibir:** Miembro recibe el pozo en su turno
5.  **Ganar:** Tokens LTD por participacion y cumplimiento

# 4. Arquitectura Tecnica

## 4.1 Stack Tecnologico

| Capa                       | Tecnologia                                                                             |
|----------------------------|----------------------------------------------------------------------------------------|
| Frontend                   | HTML5, CSS3, JavaScript (Vanilla + PWA)                                                |
| Backend                    | Node.js (HTTP nativo), PM2 cluster                                                     |
| Base de Datos              | PostgreSQL 16                                                                          |
| Cache                      | Redis                                                                                  |
| Blockchain                 | La Tanda Chain (Cosmos SDK / CometBFT), testnet `latanda-testnet-1` desde febrero 2026 |
| Modulos de cadena          | Cosmos SDK (Go)                                                                        |
| Asistente IA               | MIA (web y Telegram)                                                                   |
| Historico (2025, retirado) | Prototipo EVM en Polygon Amoy (Solidity)                                               |

## 4.2 API RESTful

API REST documentada en [latanda.online/docs](https://latanda.online/docs/) (Swagger).
Categorias principales:

- **Auth:** Login, registro, verificacion de email, tokens
- **Wallet:** Saldo LTD de testnet e historial
- **Groups/Tandas:** CRUD, miembros, turnos, tombola, registro de
  aportes y pagos de turno
- **Admin:** Usuarios, moderacion, auditoria
- **Mining:** Recompensas diarias, tiers, logros

## 4.3 Token LTD y prototipo EVM (historico)

Hoy LTD es el token nativo de La Tanda Chain (`latanda-testnet-1`,
denominacion `ultd`). Es un token de testnet sin valor monetario.

En 2025 se construyo un prototipo EVM en Polygon Amoy (testnet) con tres
contratos: **TandaToken.sol** (ERC20), **TandaGroup.sol** (grupos y
aportes) y **TandaEscrow.sol** (custodia programada). Ese prototipo fue
retirado al pasar a la cadena propia en febrero 2026 y no se usa.

Historico, sin valor: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc (ERC20
del prototipo en Polygon Amoy, retirado)

# 5. Tokenomics

## 5.1 LTD Token

LTD (La Tanda Dollar) es el token de utilidad nativo de la plataforma.

**Supply fijo + 0% inflacion real.** El supply total de 200M LTD se
mantiene fijo para siempre en mainnet (chain target `latanda-1`;
objetivo interno Q1-2027, condicionado a asesoría legal; no es
compromiso). Las recompensas a validadores y mineros NO vienen de
inflacion sino del pool pre-acunado de 40M LTD (Staking y Validadores),
distribuido en una curva de ~5 anos.  
  
**Testnet actual (`latanda-testnet-1`): 0% de inflacion desde GOV-004
(septiembre 2026).** Entre abril y septiembre de 2026 corrio con 5% de
inflacion de prueba (GOV-003), que distorsiono las recompensas y fue
revertida; por eso el supply de testnet es hoy ~204.4M LTD (200M en el
genesis). En el genesis de mainnet,
`inflation_min = inflation_max = 0.0`. Spec completa: ITP-SPEC §6
(documento técnico en preparación).

200M

Supply de genesis

Nativo

Token de la cadena

La Tanda Chain

Blockchain (testnet)

## 5.2 Distribucion

| Categoria                    | %   | Tokens     | Vesting                                       |
|------------------------------|-----|------------|-----------------------------------------------|
| Comunidad y Mineria          | 30% | 60,000,000 | Emision en 5 anos via participacion           |
| Staking y Validadores        | 20% | 40,000,000 | Delegacion programada + recompensas de bloque |
| Fondo de Desarrollo          | 12% | 24,000,000 | 6 meses cliff, 3 anos linear                  |
| Equipo y Fundadores          | 12% | 24,000,000 | 1 ano cliff, 2 anos linear                    |
| Marketing y Alianzas         | 6%  | 12,000,000 | Trimestral por hitos                          |
| **Seed Round**               | 5%  | 10,000,000 | 6 meses cliff, 18 meses linear                |
| **Strategic / Private Sale** | 5%  | 10,000,000 | 3 meses cliff, 12 meses linear                |
| Liquidez Inicial (TGE)       | 5%  | 10,000,000 | Disponible en TGE                             |
| Bug Bounties y Grants        | 3%  | 6,000,000  | Via propuestas de gobernanza                  |
| Fondo de Seguro              | 2%  | 4,000,000  | Solo via voto de emergencia                   |

**Circulante Inicial (TGE):** 10,000,000 LTD (5% del total). Los
190,000,000 restantes se liberan progresivamente segun el calendario de
vesting durante 5 anos. Los tokens de Seed y Strategic Round estan
sujetos a cliff y vesting, protegiendo el precio post-TGE.

## 5.3 Utilidad del Token

- **Staking:** Bloquear LTD para obtener beneficios premium
- **Gobernanza:** Votar en propuestas de la plataforma
- **Descuentos:** Reduccion de comisiones al pagar con LTD
- **Acceso:** Funciones exclusivas para holders
- **Recompensas:** Ganar LTD por actividad en la plataforma

# 6. Funcionalidades

## 6.1 Sistema de Tandas

- Crear grupos con configuracion flexible
- Multiples posiciones por miembro
- Tombola en vivo con WebSocket
- Bloqueo de posiciones para coordinadores
- Comision opcional del coordinador (100% para el coordinador; La Tanda
  no cobra comision)

## 6.2 Sistema de Mineria

Cualquier usuario registrado puede minar LTD diariamente. La recompensa
depende del tier alcanzado mediante achievement points — puntos que se
acumulan por actividad real en la plataforma (verificar email,
participar en tandas, pagar puntualmente, referir usuarios, etc.).

### 6.2.1 Tiers de Mineria

| Tier     | Puntos requeridos | Reward base/dia | Streak bonus max |
|----------|-------------------|-----------------|------------------|
| Bronce   | 0-49              | 1.0 LTD         | +2.0 LTD         |
| Plata    | 50-149            | 3.0 LTD         | +4.0 LTD         |
| Oro      | 150-299           | 5.0 LTD         | +7.0 LTD         |
| Platino  | 300-499           | 8.0 LTD         | +10.0 LTD        |
| Diamante | 500+              | 12.0 LTD        | +15.0 LTD        |

### 6.2.2 Achievement Points

Los puntos se acumulan automaticamente al completar logros. Hay 20
logros en 7 categorias:

- **Cuenta:** Email verificado (10 pts)
- **Participacion:** Primera tanda (20 pts), tanda completada (25 pts)
- **Financiero:** L.1000+ contribuidos (15 pts), L.10,000+ (40 pts),
  puntualidad perfecta (35 pts)
- **Social:** Primer post (10 pts), 10 seguidores (15 pts), referidos
  (15-30 pts)
- **Marketplace:** Vendedor estrella — 5+ ventas con rating 4+ (30 pts)
- **Verificacion:** KYC basico (25 pts), KYC avanzado (50 pts)
- **Engagement:** Racha de 7 dias (10 pts), racha de 30 dias (30 pts)

Un usuario tipico que verifica email, participa en una tanda, y mina 7
dias seguidos alcanza Plata (50+ pts). Alcanzar Oro o superior requiere
engagement sostenido.

### 6.2.3 Emision y Limites

- **Cap diario global:** 500 LTD/dia maximo entre todos los mineros
  (testnet)
- **Cooldown individual:** 24 horas entre claims
- **Pool de emision:** 60M LTD (30% del supply) distribuido en 5 anos
  via participacion
- **Anti-abuso:** registro de IP por reclamo, limite de 24 h, topes
  diario y de por vida

### 6.2.4 Modelo de Scaling Progresivo

Las recompensas se reducen gradualmente conforme crece el ecosistema y
LTD gana valor de mercado:

| Fase             | Trigger                | Multiplicador | Cap diario |
|------------------|------------------------|---------------|------------|
| Testnet (actual) | \<100 mineros activos  | 1.0x (base)   | 500 LTD    |
| Pre-mainnet      | 100+ mineros activos   | 0.5x          | 500 LTD    |
| Mainnet          | TGE / exchange listing | 0.25x         | 300 LTD    |
| Madurez          | 5,000+ mineros activos | 0.1x          | 200 LTD    |

Cada fase reduce la emision ~50%. El multiplicador se aplica sobre las
recompensas base de cada tier. La transicion entre fases es gobernada
por el equipo durante testnet, y por propuestas de gobernanza on-chain
en mainnet.

### 6.2.5 Progresion del Ecosistema

La Tanda esta disenada como una escalera de participacion donde cada
nivel ofrece mayores beneficios:

1.  **Usuario:** Se registra, mina LTD diario (Bronze, 1 LTD/dia)
2.  **Minero activo:** Sube de tier por actividad y rachas (Silver/Gold,
    3-5 LTD/dia)
3.  **Miembro de Tanda:** Participa en ahorro grupal, gana
    achievements + acceso financiero
4.  **Vendedor:** Vende en marketplace, gana comisiones + seller
    achievements
5.  **Delegador:** Delega LTD a un validador en La Tanda Chain, recibe
    recompensas de bloque + vota en gobernanza
6.  **Validador:** Opera nodo, valida bloques, recibe delegacion
    (2,000-5,000 LTD)
7.  **Inversor:** Aporta capital pre-TGE, obtiene tokens con descuento y
    vesting

# 7. Seguridad

## 7.1 Infraestructura

- SSL/TLS 1.2+ obligatorio
- Rate limiting (nginx + fail2ban)
- Firewall UFW configurado
- PostgreSQL/Redis solo localhost

## 7.2 Aplicacion

- JWT con expiracion (24h/7d)
- Bcrypt para passwords (12 rounds)
- Sanitizacion de inputs (XSS prevention)
- Queries parametrizadas (SQL injection prevention)
- CORS restringido

## 7.3 Headers de Seguridad

- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

## 7.4 Compliance

- Verificacion de identidad (KYC): no activa. Si algun dia los pagos
  pasan por la plataforma, la hara un socio de pagos con licencia
- Logs de auditoria de acciones sensibles (inicio de sesion, cambios de
  cuenta, acciones de administracion)

# 8. La Tanda Chain

La Tanda comenzo como una plataforma para digitalizar tandas. Ha
evolucionado en un ecosistema financiero completo: ahorro grupal,
marketplace P2P, mineria de tokens, asistente IA y gobernanza
comunitaria. La Tanda Chain es la capa de infraestructura que unifica
estos servicios bajo una red descentralizada y soberana.

**Hoy (desde febrero 2026):** La Tanda Chain — blockchain soberana
construida con Cosmos SDK / CometBFT donde LTD es el token nativo de
gas, staking y gobernanza. Corre como testnet (`latanda-testnet-1`); LTD
de testnet no tiene valor monetario.  
**Antes (2025):** prototipo EVM en Polygon Amoy (testnet), retirado.

## 8.1 Arquitectura de la Cadena

La Tanda Chain utiliza **CometBFT** (antes Tendermint) como motor de
consenso, proporcionando tolerancia a fallas bizantinas, finalidad
instantanea y Proof of Stake delegado (DPoS).

5s

Tiempo de bloque

1,000+

TPS objetivo

BFT

Consenso

IBC

Interoperabilidad

### Modulos nativos de la cadena (planeados)

| Modulo           | Funcion                                                                                                               |
|------------------|-----------------------------------------------------------------------------------------------------------------------|
| **x/ltd**        | Token nativo — transferencias, burns, fees. Suministro fijo 200M (0% inflacion). Recompensas via treasury pre-acunado |
| **x/tanda**      | Ciclos de tandas, contribuciones, pagos, resultados de sorteo. Multi-sig para distribucion                            |
| **x/mercado**    | Escrow de marketplace, reputacion de vendedores, arbitraje de disputas                                                |
| **x/mineria**    | Recompensas por actividad, tiers, anti-sybil, distribucion programada desde treasury                                  |
| **x/gobernanza** | Propuestas, votacion (1 LTD = 1 voto, 1.5x si staking \>180d), quorum 33%                                             |

### On-chain vs Off-chain

| On-chain (La Tanda Chain, diseno) | Off-chain (PostgreSQL + Redis)             |
|-----------------------------------|--------------------------------------------|
| Transferencias y balances LTD     | Perfiles de usuario, PII, KYC              |
| Creacion de tandas, reglas, pagos | Feed social, comentarios, chat             |
| Escrow de marketplace             | Conversaciones con MIA (IA)                |
| Pruebas de RNG para sorteos       | Registro de aportes y pagos de turno (hoy) |
| Staking, gobernanza, mineria      | Sesiones, analytics, UI                    |

## 8.2 Participantes de la Red

### Nodos

Cualquier maquina que ejecuta el software de La Tanda Chain. Los nodos
mantienen una copia del estado y retransmiten transacciones.

| Tipo           | Rol                                                         | Operador                           |
|----------------|-------------------------------------------------------------|------------------------------------|
| Full Node      | Historial completo, valida transacciones, sirve consultas   | Ray-Banks, socios, desarrolladores |
| Validator Node | Full node + participa en consenso (propone y firma bloques) | Validadores calificados            |
| Archive Node   | Full node + retiene todo el estado historico                | Exploradores de bloques, analytics |
| Light Client   | Verifica headers, consulta estado via full nodes            | Wallets moviles, integraciones     |

### Validadores

Operadores de nodo admitidos al conjunto activo que participan en la
produccion de bloques.

| Requisito    | Detalle                                                                        |
|--------------|--------------------------------------------------------------------------------|
| Stake minimo | 1 LTD self-delegation minima (testnet: delegacion del proyecto)                |
| Historial    | 6+ meses activo en La Tanda                                                    |
| Verificacion | KYC/KYB previsto para mainnet, sujeto a revision legal; no se exige en testnet |
| Uptime       | 99.5%+ por epoca (10,000 bloques)                                              |
| Gobernanza   | Votar en 75%+ de propuestas                                                    |

**Conjunto de validadores (expansion progresiva):**

| Fase                               | Validadores | Seleccion                                               |
|------------------------------------|-------------|---------------------------------------------------------|
| Fase 1 — Genesis (completada)      | 7+          | Completada: 7+ validadores activos, gobernanza on-chain |
| Fase 2 — Trusted Set (en progreso) | 15-25       | Testnet incentivado: validadores + infra partners       |
| Fase 3 — Crecimiento               | 50          | Aplicaciones abiertas, por stake                        |
| Fase 4 — Madurez                   | 100         | Sin permiso, por stake                                  |
| Fase 5 — Abierta                   | 150+        | Sin limite, mercado libre                               |

### Condiciones de Slashing

| Ofensa                                            | Penalidad                                 |
|---------------------------------------------------|-------------------------------------------|
| Doble firma (firmar 2 bloques a misma altura)     | 5% del stake + jail permanente            |
| Downtime extendido (500+ bloques perdidos)        | 0.1% del stake + jail temporal (24h)      |
| Mala conducta en tanda (fallo de distribucion)    | 10% del bono de coordinador + remocion    |
| Abstencion de gobernanza (\<50% votos en 3 meses) | Advertencia → 0.05% slash en reincidencia |

### Delegadores

Cualquier holder de LTD que stakea tokens a un validador, compartiendo
recompensas y riesgos.

1.  El delegador elige un validador segun reputacion, comision y uptime
2.  Stakea LTD via transaccion `MsgDelegate`
3.  Los LTD stakeados contribuyen al peso del validador
4.  El delegador gana recompensas proporcionales, menos la comision del
    validador
5.  Puede redelegar a otro validador (periodo de unbonding: 21 dias)

**Delegacion en contexto del ecosistema:**  
Unirse a un grupo de tanda = delegacion implicita al
coordinador-validador.  
Comprar en el marketplace = delegacion temporal de confianza.  
Staking a un validador = delegacion economica explicita a largo plazo.

## 8.3 Migracion de Token: del prototipo EVM a La Tanda Chain

La migracion ya ocurrio: LTD dejo el prototipo ERC20 en Polygon Amoy
(2025, retirado, sin valor) y desde febrero 2026 es el token nativo de
la testnet propia `latanda-testnet-1`. La ruta desde ahi:

1.  **Testnet Activa (desde febrero 2026, en curso):** La Tanda Chain
    testnet (`latanda-testnet-1`) produciendo bloques desde febrero
    2026, con validadores activos, gobernanza on-chain y testnet
    incentivado
2.  **Ronda formal + Equipo (fecha por definir):** ronda de inversion
    tras constituir la C-Corp en Delaware, contratacion de equipo core,
    auditoria de seguridad
3.  **Mainnet + TGE (objetivo interno Q1-2027, no es compromiso):**
    Migracion de testnet a mainnet, Token Generation Event, IBC
    habilitado
4.  **Expansion (sin fecha comprometida):** expansion regional
    (Guatemala, El Salvador), modulos nativos activos

## 8.4 Economia de Validadores

| Fuente de Ingreso                                        | Distribucion                                  |
|----------------------------------------------------------|-----------------------------------------------|
| Fees de transaccion (0.01 LTD base)                      | Validadores 80% \| Tesoreria 15% \| Burn 5%   |
| Comisiones de tanda (opcionales, las acuerda cada grupo) | Coordinador 100% (La Tanda no cobra comision) |
| Fees de marketplace                                      | Arbitradores 50% \| Tesoreria 30% \| Burn 20% |
| Fees de bridge (0.1%)                                    | Validadores 60% \| Tesoreria 30% \| Burn 10%  |

**Recompensas de staking:** sin cifra de rendimiento publicada; varian
segun comision del validador y actividad de la red y no estan
garantizadas. Fuente: fees de transaccion + distribucion programada del
treasury pre-acunado (40M LTD asignados a staking/validadores). Sin
inflacion — suministro fijo de 200M.

## 8.5 Interoperabilidad

- **IBC (Cosmos):** Conexion con Osmosis (DEX), Noble (USDC nativo),
  Cosmos Hub
- **Puentes a otras redes:** interoperabilidad (IBC/puentes), sin fecha
- **Rampas Fiat:** transferencia bancaria / dinero movil, solo a traves
  de un socio con licencia; hoy no hay ninguno contratado ni fecha

## 8.6 Seguridad de la Cadena

- **Consenso:** CometBFT tolera \<1/3 validadores bizantinos. Finalidad
  de ~5-6 segundos
- **Staking:** Delegacion del proyecto durante testnet. Mainnet
  requerira stake significativo como desincentivo economico
- **Bridge:** Verificacion light client IBC (sin intermediarios). Rate
  limit: max 1M LTD/24h. Pausa de emergencia via gobernanza
- **Privacidad:** Montos on-chain visibles solo para participantes y
  validadores asignados. ZK-SNARKs planeados para Fase 4
- **Auditorias:** Se auditaran por firmas externas antes de mainnet
  (planeado)

# 9. Roadmap Integral

## Completado (2024-2025)

- Infraestructura core y API REST
- Sistema de tandas con WebSocket y tombola en vivo
- Prototipo EVM de LTD en Polygon Amoy (ERC20, retirado en 2026)
- Sistema de mineria, gamificacion y marketplace
- MIA — asistente IA financiero

## 2026 — Plataforma (en produccion)

- Registro de tandas: aportes y pagos de turno registrados en la
  plataforma y confirmados por quien coordina cada grupo (al
  11-oct-2026: 5 tandas creadas, 3 activas; 3 con pagos de turno
  completados; 47 pagos de turno completados)
- 95 usuarios registrados al 11-oct-2026 (cuenta creada; no verificados
  por KYC)
- Inicio de sesion con Google y recuperacion de cuenta
- Chat de grupo en tiempo real
- Equipos y jornadas para negocios: horario del equipo, jornadas
  abiertas, recordatorios y marcaje de asistencia
- Agenda de citas para servicios: disponibilidad, reprogramacion,
  recordatorios e invitaciones de calendario
- Suite de negocio gratis (Mi Negocio): facturacion, reportes, gastos y
  generador de documentos
- MIA, asistente IA (web y Telegram)

## 2026 — Testnet Activa (en curso)

- La Tanda Chain testnet (`latanda-testnet-1`) produciendo bloques desde
  el genesis de febrero 2026: mas de 3.5 millones de bloques al
  11-oct-2026
- 51 validadores registrados en la cadena, 35 de ellos en el set activo
  (al 11-oct-2026)
- Gobernanza on-chain: 4 propuestas aprobadas (GOV-001 a GOV-004,
  mar-sep 2026)
- Testnet incentivado con tiers de delegacion (Validator 2K, Infra
  Partner 5K LTD)
- Bug bounty y grants para contribuidores
- Software de nodo y documentacion open-source

Cifras al 11-oct-2026; cifras en vivo:
[latanda.online/api/public/metrics](https://latanda.online/api/public/metrics)

## 2026 — Institucional

- En conversacion con el Hub de Innovacion Financiera de la CNBS
  (Honduras), desde septiembre 2026
- C-Corp en Delaware: en preparacion (aun no constituida)
- Ronda formal de inversion: fecha por definir

## Proximos pasos (sin fecha comprometida)

- Auditoria de seguridad (cadena + plataforma)
- Contratacion de equipo core
- App movil
- Hash anchors de pagos (SHA-256 para futura migracion on-chain) y
  dual-write PostgreSQL + chain testnet

## Objetivo interno Q1-2027 (no es compromiso) — Mainnet + TGE

- Migracion de testnet a mainnet
- Token Generation Event (TGE — 10M LTD circulante)
- IBC habilitado, staking de delegadores abierto
- Chain se convierte en fuente de verdad

## Expansion (sin fecha comprometida)

- 50 validadores activos en 10+ paises
- SDK de La Tanda para desarrolladores terceros
- Tandas transfronterizas (settlement en LTD o USDC via IBC)
- Roles especializados: validadores de tanda, arbitradores de
  marketplace, oraculos
- Conexiones IBC: Osmosis (DEX), Noble (USDC)

## Vision a largo plazo, sin fechas ni compromisos — Madurez

- 100+ validadores, entrada sin permiso
- Tesoreria DAO activa — fees del protocolo controlados por la comunidad
- Fondo de seguro operacional
- Integraciones DeFi (posiciones de tanda como colateral)
- API empresarial: bancos y microfinancieras integran tanda-as-a-service
- Fundacion La Tanda establecida

## Vision a largo plazo, sin fechas ni compromisos — Protocolo Abierto

- 150+ validadores, sin limite
- Cadenas satelite regionales conectadas via IBC (Africa, Asia)
- Soporte multi-modelo: chit funds (India), susu (Africa), hui
  (Vietnam), paluwagan (Filipinas)
- Interoperabilidad con finanzas tradicionales (tarjetas, remesas)
- DAO completamente autonomo con consejo electo para emergencias

[Ver roadmap detallado →](roadmap.html)

# 10. Equipo y Legal

## 10.1 Entidad Legal

**Ray-Banks LLC**  
New Mexico Limited Liability Company  
EIN: 37-2158338  
Operando como: Latanda Financial Services

## 10.2 Equipo Fundador

La Tanda es desarrollada por un equipo distribuido liderado por el
fundador, con roles clave siendo reclutados activamente a traves del
programa de bounties y la comunidad Cosmos.

| Rol                                   | Estado     | Asignacion (Pool Equipo) |
|---------------------------------------|------------|--------------------------|
| **Fundador / Arquitecto**             | Activo     | 8,000,000 LTD            |
| **Lider de Infraestructura**          | Reclutando | 2,500,000 LTD            |
| **Desarrollador Frontend**            | Reclutando | 2,500,000 LTD            |
| **Comunidad / Crecimiento**           | Reclutando | 2,000,000 LTD            |
| **Desarrollador Mobile**              | Post-Seed  | 2,500,000 LTD            |
| **CTO / Desarrollador Backend+Chain** | Post-Seed  | 4,000,000 LTD            |
| **Disenador / UX**                    | 2027       | 1,500,000 LTD            |
| **Reserva**                           | \-         | 1,000,000 LTD            |

**Vesting:** Todos los roles del equipo tienen 1 ano de cliff y 2 anos
de vesting lineal. Total del pool Equipo: 24,000,000 LTD (12% del
suministro).

**Unete al equipo:** Los mejores contribuidores del [programa de
bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)
son invitados a roles de equipo. Tambien aceptamos aplicaciones directas
para roles especializados. Contacto: <contact@latanda.online>

## 10.3 Validadores y Socios de Infraestructura

| Operador                         | Estado | Desde        |
|----------------------------------|--------|--------------|
| **Ray-Banks** (genesis)          | Activo | Febrero 2026 |
| **PRO Delegators** (Nuxian Labs) | Activo | Marzo 2026   |

## 10.4 Contacto

- **Website:** [latanda.online](https://latanda.online)
- **Corporate:** [raybanks.org](https://raybanks.org)
- **Email:** contact@latanda.online
- **GitHub:**
  [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
- **Twitter:** @TandaWeb3
- **Investors:** [latanda.online/invest](/invest.html) \|
  <invest@latanda.online>

## 10.5 Disclaimer

Este documento es solo para fines informativos y no constituye
asesoramiento financiero, legal o de inversion. Los tokens LTD
actualmente operan en testnet y no tienen valor monetario. Invertir en
criptomonedas conlleva riesgos significativos. Consulte con
profesionales antes de tomar decisiones financieras.

### Historial de versiones

**Octubre 2026 (v2.1):** Se retiraron funciones que ya no forman parte
de la plataforma publica. Se corrigieron afirmaciones que no reflejaban
el producto: la verificacion de identidad (KYC) no esta activa, no hubo
una evaluacion PCI-DSS completada, los registros de auditoria ya no se
describen como inmutables, las rampas fiat no tienen socio contratado y
se quitaron conteos de tablas y endpoints. El prototipo EVM en Polygon
Amoy figura como historico (retirado). La inflacion de testnet volvio a
0% (GOV-004). Cifras al 11-oct-2026 desde la fuente publica.

**Septiembre 2026:** Esta version reemplaza a las anteriores. Las
versiones previas incluian una estimacion de rendimiento (APY) para
staking; esa estimacion fue retirada y ya no aplica. Mientras la red
este en testnet no publicamos cifras de rendimiento: las recompensas de
staking dependeran de la comision del validador y de la actividad de la
red, y no estan garantizadas. Tambien se actualizo el roadmap (seccion
9) con el estado a septiembre 2026.

2024-2026 Ray-Banks LLC. Todos los derechos reservados.

[Roadmap](roadmap.html) \| [Privacidad](privacy-policy.html) \|
[Terminos](terms-of-service.html) \| [API
Docs](https://latanda.online/docs)
