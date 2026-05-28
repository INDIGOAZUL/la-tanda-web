<!--
Whitepaper La Tanda v2.0 — fuente canónica en español.
Convertido desde /var/www/html/main/whitepaper.html el 2026-05-04 vía pandoc + cleanup.
NO EDITAR este archivo a menos que sea para sincronizarlo con el HTML canónico publicado.
Las traducciones viven en archivos hermanos: pt-br.md, en.md, etc.
-->

La Tanda

Whitepaper Tecnico v2.0

Febrero 2026 \| Ray-Banks LLC

## Contenido

-   [1. Resumen Ejecutivo](#abstract)
-   [2. El Problema](#problem)
-   [3. La Solucion](#solution)
-   [4. Tecnologia](#technology)
-   [5. Tokenomics](#tokenomics)
-   [6. Funcionalidades](#features)
-   [7. Seguridad](#security)
-   [8. La Tanda Chain](#chain)
-   [9. Roadmap](#roadmap)
-   [10. Equipo y Legal](#team)

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

$500B+

Mercado de ROSCAs global

140+

Endpoints API

200M

LTD Token Supply

# 2. El Problema

## 2.1 Exclusion Financiera

Segun el Banco Mundial, 1.7 mil millones de adultos no tienen acceso a
servicios bancarios. En America Latina, el 45% de la poblacion esta
sub-bancarizada, dependiendo de sistemas informales para ahorro y
credito.

## 2.2 Limitaciones de Tandas Tradicionales

-   **Confianza:** Dependen de relaciones personales, limitando el
    alcance
-   **Transparencia:** Sin registros verificables de transacciones
-   **Escala:** Dificil crecer mas alla de comunidades locales
-   **Seguridad:** Riesgo de incumplimiento sin garantias
-   **Acceso:** Requieren presencia fisica y coordinacion manual

## 2.3 Barreras de Web3

Las soluciones DeFi existentes son demasiado complejas para usuarios no
tecnicos, con interfaces intimidantes, tarifas de gas impredecibles y
riesgos de seguridad.

# 3. La Solucion: La Tanda

La Tanda combina lo mejor de ambos mundos: la familiaridad y confianza
de las tandas tradicionales con la seguridad, transparencia y alcance
global de blockchain.

## 3.1 Propuesta de Valor

| Caracteristica | Tanda Tradicional      | La Tanda Web3         |
|----------------|------------------------|-----------------------|
| Alcance        | Local (10-20 personas) | Global (sin limite)   |
| Transparencia  | Verbal/papel           | Blockchain inmutable  |
| Seguridad      | Confianza personal     | Smart contracts + KYC |
| Pagos          | Efectivo/banco         | Crypto + fiat         |
| Recompensas    | Ninguna                | Tokens LTD            |

## 3.2 Como Funciona

1.  **Crear/Unirse:** Usuario crea una tanda o se une a una existente
2.  **Contribuir:** Pagos periodicos automaticos o manuales
3.  **Sorteo:** Sistema de tombola en vivo determina turnos
4.  **Recibir:** Miembro recibe el pozo en su turno
5.  **Ganar:** Tokens LTD por participacion y cumplimiento

# 4. Arquitectura Tecnica

## 4.1 Stack Tecnologico

| Capa                | Tecnologia                              |
|---------------------|-----------------------------------------|
| Frontend            | HTML5, CSS3, JavaScript (Vanilla + PWA) |
| Backend             | Node.js (HTTP nativo), PM2 cluster      |
| Base de Datos       | PostgreSQL 16 (25 tablas)               |
| Cache               | Redis                                   |
| Blockchain (Fase 1) | Polygon (Amoy testnet → PoS mainnet)    |
| Blockchain (Fase 2) | La Tanda Chain (Cosmos SDK / CometBFT)  |
| Smart Contracts     | Solidity + Cosmos SDK modules (Go)      |
| ML/AI               | Python, XGBoost, scikit-learn           |

## 4.2 API RESTful

140+ endpoints organizados en categorias:

-   **Auth (12):** Login, registro, verificacion, tokens
-   **Wallet (15):** Balance, depositos, retiros, historial
-   **Groups/Tandas (18):** CRUD, miembros, turnos, tombola
-   **Admin (12):** Usuarios, KYC, pagos, auditoria
-   **Lottery (15):** Predicciones ML, suscripciones, estadisticas
-   **Mining (7):** Recompensas diarias, tiers, logros

## 4.3 Smart Contracts

LTD Token: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc (Polygon Amoy)

-   **TandaToken.sol:** ERC20 token con funciones de gobernanza
-   **TandaGroup.sol:** Logica de grupos y contribuciones
-   **TandaEscrow.sol:** Custodia de fondos con liberacion programada

# 5. Tokenomics

## 5.1 LTD Token

LTD (La Tanda Dollar) es el token de utilidad nativo del ecosistema La
Tanda. Actualmente existe en dos formas: como token ERC20 en Polygon
Amoy testnet (Fase 1, legacy) y como token nativo de **La Tanda Chain**
(Fase 2, testnet activo). Ver Seccion 8 para detalles de la migracion.

200M

Supply Total Fijo

0%

Inflacion

Cosmos SDK

La Tanda Chain

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

-   **Staking:** Bloquear LTD para obtener beneficios premium
-   **Gobernanza:** Votar en propuestas de la plataforma
-   **Descuentos:** Reduccion de comisiones al pagar con LTD
-   **Acceso:** Funciones exclusivas para holders
-   **Recompensas:** Ganar LTD por actividad en la plataforma

## 5.4 Sostenibilidad Post-Staking Pool

El pool **Staking y Validadores** (40M LTD, 20% del supply) esta
disenado para sostener el APY de validadores durante aproximadamente 8
anos de distribucion programada. Dado que LTD tiene **supply fijo de
200M sin inflacion**, cuando este pool se agote la red debe sostener la
seguridad mediante mecanismos alternativos. A diferencia de Bitcoin (que
depende exclusivamente de fees de transaccion post block-subsidy), La
Tanda cuenta con **seis fuentes redundantes** para sostener a los
validadores a perpetuidad:

1.  **Fees de transaccion (activado en genesis):** Con un min_gas_price
    de 0.001 ultd, una chain con uso real (decenas de miles de usuarios
    haciendo contribuciones diarias a tandas, bookings de marketplace,
    interacciones sociales on-chain) genera fees suficientes para
    sostener una red de validadores profesional. A diferencia de
    Bitcoin, LTD es una chain de *economia productiva*, no solo
    store-of-value.
2.  **Comisiones de marketplace → validadores (Ano 1):** Una
    micro-comision (ejemplo: 0.5% del GMV del marketplace) se rutea
    automaticamente al fee pool de validadores en cada bloque. Con un
    marketplace procesando volumen real, esto agrega un flujo de
    ingresos significativo que no existe en Bitcoin ni en chains de puro
    store-of-value.
3.  **Mecanismo de burn (ya activo):** El 5-20% de cada tipo de fee se
    quema (ver Seccion 8.4). Esto reduce el supply circulante con el
    tiempo, haciendo que los LTD restantes valgan proporcionalmente mas.
    Efecto compuesto ano tras ano, similar a Ethereum post-EIP-1559.
4.  **Treasury subsidy (Ano 8+ si necesario):** Los pools *Fondo de
    Desarrollo* (24M), *Bug Bounties* (6M) y *Fondo de Seguro* (4M)
    pueden subsidiar validadores durante 10+ anos adicionales mediante
    propuestas de gobernanza, sin tocar el supply fijo de 200M.
5.  **Re-asignacion gobernada de pools:** La comunidad puede votar
    re-asignar tokens no-utilizados de pools maduros (ejemplo: Liquidez
    Inicial ya ejecutada) a incentivos de seguridad. Esto NO rompe el
    cap de 200M, solo mueve LTD entre pools.
6.  **Tanda network fee (opcional, ultimo recurso):** Un fee de red
    minusculo sobre contribuciones de tandas (no una comision de
    plataforma), activable solo si las otras cinco fuentes resultaran
    insuficientes. Preserva el pitch de *0% comision en tandas* porque
    seria un fee de la blockchain, no de La Tanda como plataforma.

**Comparado con Bitcoin:** Bitcoin depende exclusivamente de fees de
transaccion despues del agotamiento del block subsidy (proyectado
\~2140), un modelo no probado a largo plazo. La Tanda tiene **seis
mecanismos redundantes** y una economia productiva real (tandas,
marketplace, social) generando fees desde el dia uno. Ademas, la
gobernanza on-chain permite activar mecanismos de emergencia si fuera
necesario — algo imposible en Bitcoin.

# 6. Funcionalidades

## 6.1 Sistema de Tandas

-   Crear grupos con configuracion flexible
-   Multiples posiciones por miembro
-   Tombola en vivo con WebSocket
-   Bloqueo de posiciones para coordinadores
-   Sistema de comisiones 90/10

## 6.2 Predictor de Loteria

Sistema ML para predicciones de "La Diaria" Honduras:

-   Modelos XGBoost por horario (11am, 3pm, 9pm)
-   42% precision Top-1 (42x mejor que aleatorio)
-   Sistema freemium (Gratis/Premium/Diamante)
-   Gamificacion: logros, puntos, rankings

## 6.3 Sistema de Mineria

Cualquier usuario registrado puede minar LTD diariamente. La recompensa
depende del tier alcanzado mediante achievement points — puntos que se
acumulan por actividad real en la plataforma (verificar email,
participar en tandas, pagar puntualmente, referir usuarios, etc.).

### 6.3.1 Tiers de Mineria

| Tier     | Puntos requeridos | Reward base/dia | Streak bonus max |
|----------|-------------------|-----------------|------------------|
| Bronce   | 0-49              | 1.0 LTD         | +2.0 LTD         |
| Plata    | 50-149            | 3.0 LTD         | +4.0 LTD         |
| Oro      | 150-299           | 5.0 LTD         | +7.0 LTD         |
| Platino  | 300-499           | 8.0 LTD         | +10.0 LTD        |
| Diamante | 500+              | 12.0 LTD        | +15.0 LTD        |

### 6.3.2 Achievement Points

Los puntos se acumulan automaticamente al completar logros. Hay 20
logros en 7 categorias:

-   **Cuenta:** Email verificado (10 pts)
-   **Participacion:** Primera tanda (20 pts), tanda completada (25 pts)
-   **Financiero:** L.1000+ contribuidos (15 pts), L.10,000+ (40 pts),
    puntualidad perfecta (35 pts)
-   **Social:** Primer post (10 pts), 10 seguidores (15 pts), referidos
    (15-30 pts)
-   **Marketplace:** Vendedor estrella — 5+ ventas con rating 4+ (30
    pts)
-   **Verificacion:** KYC basico (25 pts), KYC avanzado (50 pts)
-   **Engagement:** Racha de 7 dias (10 pts), racha de 30 dias (30 pts)

Un usuario tipico que verifica email, participa en una tanda, y mina 7
dias seguidos alcanza Plata (50+ pts). Alcanzar Oro o superior requiere
engagement sostenido.

### 6.3.3 Emision y Limites

-   **Cap diario global:** 500 LTD/dia maximo entre todos los mineros
    (testnet)
-   **Cooldown individual:** 24 horas entre claims
-   **Pool de emision:** 60M LTD (30% del supply) distribuido en 5 anos
    via participacion
-   **Anti-fraude:** IP tracking, rate limiting, fraud flags

### 6.3.4 Modelo de Scaling Progresivo

Las recompensas se reducen gradualmente conforme crece el ecosistema y
LTD gana valor de mercado:

| Fase             | Trigger                | Multiplicador | Cap diario |
|------------------|------------------------|---------------|------------|
| Testnet (actual) | \<100 mineros activos  | 1.0x (base)   | 500 LTD    |
| Pre-mainnet      | 100+ mineros activos   | 0.5x          | 500 LTD    |
| Mainnet          | TGE / exchange listing | 0.25x         | 300 LTD    |
| Madurez          | 5,000+ mineros activos | 0.1x          | 200 LTD    |

Cada fase reduce la emision \~50%. El multiplicador se aplica sobre las
recompensas base de cada tier. La transicion entre fases es gobernada
por el equipo durante testnet, y por propuestas de gobernanza on-chain
en mainnet.

### 6.3.5 Progresion del Ecosistema

La Tanda esta disenada como una escalera de participacion donde cada
nivel ofrece mayores beneficios:

1.  **Usuario:** Se registra, mina LTD diario (Bronze, 1 LTD/dia)
2.  **Minero activo:** Sube de tier por actividad y rachas (Silver/Gold,
    3-5 LTD/dia)
3.  **Miembro de Tanda:** Participa en ahorro grupal, gana
    achievements + acceso financiero
4.  **Vendedor:** Vende en marketplace, gana comisiones + seller
    achievements
5.  **Delegador:** Puentea LTD a la chain, delega a validador, gana
    block rewards + vota en gobernanza
6.  **Validador:** Opera nodo, valida bloques, recibe delegacion
    (2,000-5,000 LTD)
7.  **Inversor:** Aporta capital pre-TGE, obtiene tokens con descuento y
    vesting

## 6.4 Suscripciones

| Plan     | Precio  | Beneficios                             |
|----------|---------|----------------------------------------|
| Gratis   | $0      | 1 spin/dia, horario 9pm                |
| Premium  | $25/mes | 3 spins/dia, todos horarios, historial |
| Diamante | $49/mes | Ilimitado, 5 numeros, API acceso       |

# 7. Seguridad

## 7.1 Infraestructura

-   SSL/TLS 1.2+ obligatorio
-   Rate limiting (nginx + fail2ban)
-   Firewall UFW configurado
-   PostgreSQL/Redis solo localhost

## 7.2 Aplicacion

-   JWT con expiracion (24h/7d)
-   Bcrypt para passwords (12 rounds)
-   Sanitizacion de inputs (XSS prevention)
-   Queries parametrizadas (SQL injection prevention)
-   CORS restringido

## 7.3 Headers de Seguridad

-   Strict-Transport-Security (HSTS)
-   Content-Security-Policy (CSP)
-   X-Frame-Options: DENY
-   X-Content-Type-Options: nosniff

## 7.4 Compliance

-   KYC/AML para verificacion de identidad
-   Evaluacion PCI-DSS completada
-   Logs de auditoria inmutables

# 8. La Tanda Chain

La Tanda comenzo como una plataforma para digitalizar tandas. Ha
evolucionado en un ecosistema financiero completo: ahorro grupal,
marketplace P2P, predicciones con ML, mineria de tokens, asistente IA y
gobernanza comunitaria. La Tanda Chain es la capa de infraestructura que
unifica estos servicios bajo una red descentralizada y soberana.

**Fase 1:** LTD como ERC20 en Polygon (actual)  
**Fase 2:** La Tanda Chain — blockchain soberana construida con Cosmos
SDK / CometBFT donde LTD es el token nativo de gas, staking y
gobernanza.

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

### Modulos nativos de la cadena

| Modulo           | Funcion                                                                                                               |
|------------------|-----------------------------------------------------------------------------------------------------------------------|
| **x/ltd**        | Token nativo — transferencias, burns, fees. Suministro fijo 200M (0% inflacion). Recompensas via treasury pre-acunado |
| **x/tanda**      | Ciclos de tandas, contribuciones, pagos, resultados de sorteo. Multi-sig para distribucion                            |
| **x/mercado**    | Escrow de marketplace, reputacion de vendedores, arbitraje de disputas                                                |
| **x/loteria**    | RNG verificable (commit-reveal), scheduling de sorteos, mercado de predicciones                                       |
| **x/mineria**    | Recompensas por actividad, tiers, anti-sybil, distribucion programada desde treasury                                  |
| **x/gobernanza** | Propuestas, votacion (1 LTD = 1 voto, 1.5x si staking \>180d), quorum 33%                                             |

### On-chain vs Off-chain

| On-chain (La Tanda Chain)         | Off-chain (PostgreSQL + Redis) |
|-----------------------------------|--------------------------------|
| Transferencias y balances LTD     | Perfiles de usuario, PII, KYC  |
| Creacion de tandas, reglas, pagos | Feed social, comentarios, chat |
| Escrow de marketplace             | Conversaciones con MIA (IA)    |
| Pruebas de RNG para sorteos       | Modelos ML de prediccion       |
| Staking, gobernanza, mineria      | Sesiones, analytics, UI        |

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

| Requisito    | Detalle                                                         |
|--------------|-----------------------------------------------------------------|
| Stake minimo | 1 LTD self-delegation minima (testnet: delegacion del proyecto) |
| Historial    | 6+ meses activo en La Tanda                                     |
| Verificacion | KYC/KYB completado                                              |
| Uptime       | 99.5%+ por epoca (10,000 bloques)                               |
| Gobernanza   | Votar en 75%+ de propuestas                                     |

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

## 8.3 Migracion de Token: Polygon → La Tanda Chain

LTD existe actualmente como ERC20 en Polygon Amoy testnet. La migracion
a token nativo de La Tanda Chain sigue esta ruta:

1.  **Testnet Activa (Q1-Q2 2026):** La Tanda Chain testnet en
    produccion con 10+ validadores, gobernanza on-chain, testnet
    incentivado (ver 8.3.1)
2.  **Seed Round + Equipo (Q2-Q3 2026):** Cierre de ronda seed,
    contratacion de equipo core, auditoria de seguridad
3.  **Mainnet Launch + TGE (Q1-Q2 2027):** Mainnet lanzada como chain
    nueva con genesis independiente, Token Generation Event, primer
    listing DEX, IBC habilitado
4.  **Expansion (Q3-Q4 2027):** CEX listing, expansion regional
    (Guatemala, El Salvador), modulos nativos activos

### 8.3.1 Estrategia Testnet → Mainnet

Testnet (`latanda-testnet-1`) y mainnet (`latanda-1`, pendiente) son
chains tecnicamente separadas. La estrategia oficial es la siguiente:

-   **Testnet mantiene sus parametros actuales:** 5% de inflacion de
    bloque (valor heredado del genesis experimental) se preserva como
    sandbox de desarrollo. No se ejecutara propuesta de gobernanza para
    modificar parametros de testnet — cambiar reglas mid-game genera
    friccion innecesaria con validadores activos.
-   **Mainnet nace limpia con el modelo oficial:** 200M fijo, 0%
    inflacion real, recompensas desde el pool Staking y Validadores
    pre-acunado. Testnet puede continuar corriendo en paralelo
    post-launch o desmantelarse segun necesidad de la comunidad.
-   **Los tokens de testnet no migran automaticamente:** son play money
    de desarrollo, no se heredan al genesis de mainnet.

### 8.3.2 Incentivized Testnet Program

Los validadores, nodos y colaboradores activos durante testnet reciben
compensacion en LTD *real* en el genesis de mainnet, financiada desde el
pool **Comunidad y Mineria**. Su trabajo en testnet se convierte
directamente en participacion de mainnet:

| Tier                 | Slots   | LTD por slot | Total         | Requisitos                                         |
|----------------------|---------|--------------|---------------|----------------------------------------------------|
| **Infra Partner**    | 5       | 5,000        | 25,000        | RPC/API publico, explorer, statesync, guia tecnica |
| **Validator**        | 10      | 2,000        | 20,000        | Uptime \>95%, votar en gobernanza, sin jailing     |
| **Full Node**        | 20      | 500          | 10,000        | Nodo sincronizado, relay de transacciones          |
| **Bug Reporter**     | Abierto | 100-1,000    | \~10,000      | Reporte verificado via GitHub issue                |
| **Buffer adicional** | —       | —            | \~35,000      | Reserva para nuevos participantes hasta mainnet    |
| **TOTAL**            |         |              | **\~100,000** | 0.05% del supply total                             |

Este programa reemplaza cualquier necesidad de modificar los parametros
de testnet via gobernanza. Los validadores externos que contribuyeron al
bootstrap de la red reciben su compensacion en mainnet como
reconocimiento explicito del valor aportado, en vez de depender de
recompensas inflacionarias de testnet que no tendrian valor economico
real.

## 8.4 Economia de Validadores

| Fuente de Ingreso                   | Distribucion                                  |
|-------------------------------------|-----------------------------------------------|
| Fees de transaccion (0.01 LTD base) | Validadores 80% \| Tesoreria 15% \| Burn 5%   |
| Comisiones de tanda                 | Coordinador 85% \| Tesoreria 10% \| Burn 5%   |
| Fees de marketplace                 | Arbitradores 50% \| Tesoreria 30% \| Burn 20% |
| Suscripciones de loteria            | Tesoreria 70% \| Oraculos 20% \| Burn 10%     |
| Fees de bridge (0.1%)               | Validadores 60% \| Tesoreria 30% \| Burn 10%  |

**APY estimado:** Validadores 15-25% \| Delegadores 10-20% (varia segun
comision del validador y actividad de la red). Fuente: fees de
transaccion + distribucion programada del treasury pre-acunado (40M LTD
asignados a staking/validadores). Sin inflacion — suministro fijo de
200M.

## 8.5 Interoperabilidad

-   **IBC (Cosmos):** Conexion con Osmosis (DEX), Noble (USDC nativo),
    Cosmos Hub
-   **Polygon Bridge:** Composabilidad DeFi, listings en exchanges,
    integraciones legacy
-   **Rampas Fiat:** Transferencia bancaria / dinero movil ↔ LTD via
    socios regulados en Honduras y LATAM

## 8.6 Seguridad de la Cadena

-   **Consenso:** CometBFT tolera \<1/3 validadores bizantinos.
    Finalidad de 5 segundos
-   **Staking:** Delegacion del proyecto durante testnet. Mainnet
    requerira stake significativo como desincentivo economico
-   **Bridge:** Verificacion light client IBC (sin intermediarios). Rate
    limit: max 1M LTD/24h. Pausa de emergencia via gobernanza
-   **Privacidad:** Montos on-chain visibles solo para participantes y
    validadores asignados. ZK-SNARKs planeados para Fase 4
-   **Auditorias:** Smart contracts y modulos auditados por 2+ firmas
    independientes antes de cada fase

# 9. Roadmap Integral

## Completado (2024-2025)

-   Infraestructura core y API (140+ endpoints)
-   Sistema de tandas con WebSocket y tombola en vivo
-   LTD Token en Polygon Amoy (ERC20)
-   Predictor de loteria con ML (XGBoost, 42% precision)
-   Sistema de mineria, gamificacion y marketplace
-   MIA — asistente IA financiero

## Q1-Q2 2026 — Plataforma

-   OAuth (Google, Apple, Telegram)
-   Integracion de pagos (Stripe)
-   App movil (React Native)
-   Auditoria de smart contracts
-   Hash anchors de pagos (SHA-256 para futura migracion on-chain)
-   Sistema de reputacion on-platform

## Q1-Q2 2026 — Testnet Activa (en progreso)

-   La Tanda Chain testnet con 10+ validadores activos
-   Testnet incentivado con tiers de delegacion (Validator 2K, Infra
    Partner 5K LTD)
-   Gobernanza on-chain activa (GOV-001, GOV-002 aprobadas)
-   Bug bounty y grants para contribuidores
-   Software de nodo y documentacion open-source

## Q2-Q3 2026 — Seed Round + Equipo

-   Cierre de ronda seed ($500K, FDV $5M)
-   Contratacion de equipo core (5 personas)
-   Auditoria de seguridad (chain + plataforma)
-   25+ validadores en testnet
-   Dual-write: PostgreSQL + chain testnet en paralelo

## Q1-Q2 2027 — Mainnet Launch + TGE

-   Migracion de testnet a mainnet
-   Token Generation Event (TGE — 10M LTD circulante)
-   Primer listing DEX (Osmosis o similar)
-   IBC habilitado, staking de delegadores abierto
-   Chain se convierte en fuente de verdad

## Q3-Q4 2027 — Expansion

-   50 validadores activos en 10+ paises
-   SDK de La Tanda para desarrolladores terceros
-   Tandas transfronterizas (settlement en LTD o USDC via IBC)
-   Roles especializados: validadores de tanda, arbitradores de
    marketplace, oraculos
-   Conexiones IBC: Osmosis (DEX), Noble (USDC)

## 2028 — Fase 4: Madurez

-   100+ validadores, entrada sin permiso
-   Tesoreria DAO activa — fees del protocolo controlados por la
    comunidad
-   Fondo de seguro operacional
-   Integraciones DeFi (posiciones de tanda como colateral)
-   API empresarial: bancos y microfinancieras integran
    tanda-as-a-service
-   Fundacion La Tanda establecida

## 2029+ — Fase 5: Protocolo Abierto

-   150+ validadores, sin limite
-   Cadenas satelite regionales conectadas via IBC (Africa, Asia)
-   Soporte multi-modelo: chit funds (India), susu (Africa), hui
    (Vietnam), paluwagan (Filipinas)
-   Interoperabilidad con finanzas tradicionales (tarjetas, remesas)
-   DAO completamente autonomo con consejo electo para emergencias

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

-   **Website:** [latanda.online](https://latanda.online)
-   **Corporate:** [raybanks.org](https://raybanks.org)
-   **Email:** contact@latanda.online
-   **GitHub:**
    [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
-   **Twitter:** @TandaWeb3
-   **Investors:** [latanda.online/invest](/invest.html) \|
    <invest@latanda.online>

## 10.5 Disclaimer

Este documento es solo para fines informativos y no constituye
asesoramiento financiero, legal o de inversion. Los tokens LTD
actualmente operan en testnet y no tienen valor monetario. Invertir en
criptomonedas conlleva riesgos significativos. Consulte con
profesionales antes de tomar decisiones financieras.

2024-2026 Ray-Banks LLC. Todos los derechos reservados.

[Roadmap](roadmap.html) \| [Privacidad](privacy-policy.html) \|
[Terminos](terms-of-service.html) \| [API
Docs](https://latanda.online/docs)
