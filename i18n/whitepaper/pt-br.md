<!--
Whitepaper La Tanda v2.0 — tradução canônica para português brasileiro.
Source: es.md (fonte canônica em espanhol).
Workflow: ver ../README.md.
NÃO EDITAR es.md. Tradução mantida apenas em pt-br.md.
-->

La Tanda

Whitepaper Técnico v2.0

Fevereiro 2026 \| Ray-Banks LLC

## Conteúdo

-   [1. Resumo Executivo](#abstract)
-   [2. O Problema](#problem)
-   [3. A Solução](#solution)
-   [4. Tecnologia](#technology)
-   [5. Tokenomics](#tokenomics)
-   [6. Funcionalidades](#features)
-   [7. Segurança](#security)
-   [8. La Tanda Chain](#chain)
-   [9. Roadmap](#roadmap)
-   [10. Equipe e Legal](#team)

# 1. Resumo Executivo

La Tanda é uma plataforma Web3 que digitaliza e melhora o sistema
tradicional de tandas (associações rotativas de poupança e crédito)
mediante tecnologia blockchain, democratizando o acesso a serviços
financeiros para comunidades desatendidas.

**Missão:** Construir a plataforma financeira Web3 mais acessível do
mundo, combinando a confiança das tandas tradicionais com a
transparência e segurança da blockchain.

1.7B

Pessoas sem acesso bancário

$500B+

Mercado global de ROSCAs (associações rotativas de poupança e crédito)

140+

Endpoints API

200M

LTD Token Supply

# 2. O Problema

## 2.1 Exclusão Financeira

Segundo o Banco Mundial, 1.7 bilhões de adultos não têm acesso a
serviços bancários. Na América Latina, 45% da população está
sub-bancarizada, dependendo de sistemas informais para poupança e
crédito.

## 2.2 Limitações das tandas tradicionais

-   **Confiança:** Dependem de relações pessoais, limitando o
    alcance
-   **Transparência:** Sem registros verificáveis de transações
-   **Escala:** Difícil crescer além de comunidades locais
-   **Segurança:** Risco de inadimplência sem garantias
-   **Acesso:** Exigem presença física e coordenação manual

## 2.3 Barreiras do Web3

As soluções DeFi existentes são complexas demais para usuários não
técnicos, com interfaces intimidadoras, taxas de gas imprevisíveis e
riscos de segurança.

# 3. A Solução: La Tanda

La Tanda combina o melhor de dois mundos: a familiaridade e a confiança
das tandas tradicionais com a segurança, transparência e alcance      
global da blockchain.

## 3.1 Proposta de Valor

| Característica | Tanda Tradicional      | La Tanda Web3         |
|----------------|------------------------|-----------------------|
| Alcance        | Local (10-20 pessoas) | Global (sem limite)   |
| Transparência  | Verbal/papel           | Blockchain imutável   |
| Segurança      | Confiança pessoal     | Smart contracts + KYC |
| Pagamentos          | Dinheiro/banco         | Crypto + fiat         |
| Recompensas    | Nenhuma                | Tokens LTD            |

## 3.2 Como Funciona

1.  **Criar/Entrar:** O usuário cria uma tanda ou entra em uma existente
2.  **Contribuir:** Pagamentos periódicos automáticos ou manuais
3.  **Sorteio:** Sistema de tômbola (sorteio rotativo) ao vivo determina os turnos
4.  **Receber:** O membro recebe o poço quando chega sua vez
5.  **Ganhar:** Tokens LTD por participação e pagamentos em dia

# 4. Arquitetura Técnica

## 4.1 Stack Tecnológico

| Camada              | Tecnologia                              |
|---------------------|-----------------------------------------|
| Frontend            | HTML5, CSS3, JavaScript (Vanilla + PWA) |
| Backend             | Node.js (HTTP nativo), PM2 cluster      |
| Banco de Dados      | PostgreSQL 16 (25 tabelas)              |
| Cache               | Redis                                   |
| Blockchain (Fase 1) | Polygon (Amoy testnet → PoS mainnet)    |
| Blockchain (Fase 2) | La Tanda Chain (Cosmos SDK / CometBFT)  |
| Smart Contracts     | Solidity + módulos do Cosmos SDK (Go)   |
| ML/IA               | Python, XGBoost, scikit-learn           |

## 4.2 API RESTful

140+ endpoints organizados em categorias:

-   **Auth (12):** Login, registro, verificação, tokens
-   **Wallet (15):** Saldo, depósitos, saques, histórico
-   **Groups/Tandas (18):** CRUD, membros, turnos, tômbola
-   **Admin (12):** Usuários, KYC, pagamentos, auditoria
-   **Lottery (15):** Predições com ML, assinaturas, estatísticas
-   **Mining (7):** Recompensas diárias, tiers, conquistas

## 4.3 Smart Contracts

LTD Token: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc (Polygon Amoy)

-   **TandaToken.sol:** Token ERC20 com funções de governança (governance)
-   **TandaGroup.sol:** Lógica de grupos e contribuições
-   **TandaEscrow.sol:** Custódia de fundos com liberação programada

# 5. Tokenomics

## 5.1 Token LTD

LTD (La Tanda Dollar) é o token de utilidade nativo do ecossistema La
Tanda. Atualmente existe em duas formas: como token ERC20 na Polygon
Amoy testnet (Fase 1, legacy) e como token nativo da **La Tanda Chain**
(Fase 2, testnet ativo). Consulte a Seção 8 para detalhes da migração.

200M

Supply Total Fixo

0%

Inflação

Cosmos SDK

La Tanda Chain

## 5.2 Distribuição

| Categoria                    | %   | Tokens     | Vesting                                       |
|------------------------------|-----|------------|-----------------------------------------------|
| Comunidade e Mineração       | 30% | 60,000,000 | Emissão em 5 anos via participação            |
| Staking e Validadores        | 20% | 40,000,000 | Delegação programada + recompensas de bloco   |
| Fundo de Desenvolvimento          | 12% | 24,000,000 | 6 meses  (período de bloqueio), 3 anos linear                  |
| Equipe e Fundadores          | 12% | 24,000,000 | 1 ano cliff, 2 anos linear                    |
| Mercado e Parcerias         | 6%  | 12,000,000 | Trimestral por marcos                          |
| **Seed Round**               | 5%  | 10,000,000 | 6 meses cliff, 18 meses linear                |
| **Strategic / Private Sale** | 5%  | 10,000,000 | 3 meses cliff, 12 meses linear                |
| Liquidez Inicial (TGE)       | 5%  | 10,000,000 | Disponível no TGE                             |
| Bug Bounties e Grants        | 3%  | 6,000,000  | Via propostas de governança       |
| Fundo de Seguro              | 2%  | 4,000,000  | Apenas via voto de emergência                   |

**Circulante Inicial (TGE):** 10,000,000 LTD (5% do total). Os
190,000,000 restantes são liberados progressivamente segundo o
calendário de vesting durante 5 anos. Os tokens de Seed e Strategic
Round estão sujeitos a cliff e vesting, protegendo o preço pós-TGE.

## 5.3 Utilidade do Token

-   **Staking:** Bloquear LTD para obter benefícios premium
-   **Governança:** Votar em propostas da plataforma
-   **Descontos:** Redução de comissões ao pagar com LTD
-   **Acesso:** Funções exclusivas para holders
-   **Recompensas:** Ganhar LTD por atividade na plataforma

## 5.4 Sustentabilidade Pós-Staking Pool

O pool **Staking e Validadores** (40M LTD, 20% do supply) está
projetado para sustentar o APY de validadores durante aproximadamente 8 
anos de distribuição programada. Dado que LTD possui **supply fixo de 
200M sem inflação**, quando esse pool se esgotar, a rede deverá sustentar a
segurança por meio de mecanismos alternativos. Diferentemente de Bitcoin (que 
depende exclusivamente de fees de transação post block-subsidy), La 
Tanda conta com **seis fontes redundantes** para sustentar os 
validadores permanentemente:

1.  **Fees de transação (ativado no genesis):** Com um min_gas_price
    de 0.001 ultd, uma chain com uso real (dezenas de milhares de usuários
    fazendo contribuições diárias a tandas, reservas do mercado
    interações sociais on-chain) gera fees suficientes para
    sustentar uma rede de validadores profissionais. Diferentemente do
    Bitcoin, LTD é uma chain de *economia produtiva*, não apenas
    store-of-value.
2.  **Comissões de mercado → validadores (Ano 1):** Uma
    microcomissão (exemplo: 0.5% do GMV do mercado) é roteada
    automaticamente ao fee pool de validadores em cada bloco. Com um
    mercado processando volume real, isso adiciona um fluxo de
    receita significativo que não existe no Bitcoin nem em chains de puro                                                             
    store-of-value.
3.  **Mecanismo de burn (queima, ativo):** 5-20% de cada tipo de fee é
    queimado (ver Seção 8.4). Isso reduz o supply circulante com o
    tempo, fazendo com que os LTD restantes valham proporcionalmente    mais.
    Efeito composto ano após ano, similar ao Ethereum pós-EIP-1559.
4.  **Treasury subsidy (Ano 8+ se necessário):** Os pools *Fundo de
    Desenvolvimento* (24M), *Bug Bounties* (6M) e *Fundo de Seguro* (4M)
    podem subsidiar validadores durante 10+ anos adicionais por meio de
    propostas de governança, sem tocar no supply fixo de 200M.
5.  **Re-alocação governada de pools:** A comunidade pode votar para
    re-alocar tokens não utilizados de pools maduros (exemplo: Liquidez
    Inicial já executada) para incentivos de segurança. Isso NÃO rompe o
    cap de 200M, apenas move LTD entre pools.
6.  **Tanda network fee (opcional, último recurso):** Um fee de rede
    minúsculo sobre contribuições de tandas (não uma comissão de
    plataforma), ativável apenas se as outras cinco fontes se mostrarem
    insuficientes. Preserva o pitch de *0% comissão em tandas* porque
    seria um fee da blockchain, não da La Tanda como plataforma.

**Comparado com Bitcoin:** Bitcoin depende exclusivamente de fees de
transação após o esgotamento do block subsidy (projetado para 
\~2140), um modelo não comprovado a longo prazo. La Tanda possui **seis
mecanismos redundantes** e uma economia produtiva real (tandas,
mercados, social) gerando fees desde o primeiro dia. Além disso, a
governança on-chain permite ativar mecanismos de emergência se for
necessário — algo impossível no Bitcoin.

# 6. Funcionalidades

## 6.1 Sistema de Tandas

-   Criar grupos com configuração flexível
-   Múltiplas posições por membro
-   Sistema de sorteio rotativo ao vivo com WebSocket
-   Bloqueio de posições para coordenadores
-   Sistema de comissões 90/10

## 6.2 Predictor de Loteria

Sistema ML para predições de "La Diaria" Honduras:

-   Modelos XGBoost por horário (11am, 3pm, 9pm)
-   42% de precisão Top-1 (42x melhor que aleatório)
-   Sistema freemium (Grátis/Premium/Diamante)
-   Gamificação: logros, pontos, rankings

## 6.3 Sistema de Mineração

Qualquer usuário registrado pode minerar LTD diariamente. A recompensa
depende do tier alcançado mediante achievement points — pontos que se
acumulam por atividade real na plataforma (verificar email,
participar em tandas, pagar pontualmente, indicar usuários, etc.).

### 6.3.1 Tiers de Mineração

| Tier     | Pontos requeridos |   Reward base/dia   | Streak bonus max |
|----------|-------------------|-----------------|------------------|
| Bronze   | 0-49              | 1.0 LTD             | +2.0 LTD         |
| Prata    | 50-149            | 3.0 LTD             | +4.0 LTD         |
| Ouro      | 150-299           | 5.0 LTD             | +7.0 LTD         |
| Platina  | 300-499           | 8.0 LTD             | +10.0 LTD        |
| Diamante | 500+              | 12.0 LTD            | +15.0 LTD        |

### 6.3.2 Achievement Points

Os pontos são acumulados automaticamente ao completar conquistas. Há 20
conquistas em 7 categorias:

-   **Conta:** Email verificado (10 pts)
-   **Participação:** Primeira tanda (20 pts), tanda concluída (25      pts)
-   **Financeiro:** L.1000+ contribuídos (15 pts), L.10,000+ (40 pts),
    pontualidade perfeita (35 pts)
-   **Social:** Primeiro post (10 pts), 10 seguidores (15 pts), indicações
    (15-30 pts)
-   **Marketplace:** Vendedor estrela — 5+ vendas com rating 4+ (30
    pts)
-   **Verificação:** KYC básico (25 pts), KYC avançado (50 pts)
-   **Engagement:** Sequência de 7 dias (10 pts), sequência de 30 dias (30 pts)

Um usuário típico que verifica email, participa de uma tanda e minera 7
dias seguidos alcança Prata (50+ pts). Alcançar Ouro ou superior requer
atividade contínua na plataforma.

### 6.3.3 Emissão e Limites

-   **Cap diário global:** 500 LTD/dia no máximo entre todos os
    mineradores (testnet)
-   **Cooldown individual:** 24 horas entre claims
-   **Pool de emissão:** 60M LTD (30% do supply) distribuído em 5 anos
    via participação
-   **Anti-fraude:** IP tracking, rate limiting, fraud flags

### 6.3.4 Modelo de Scaling Progressivo

As recompensas são reduzidas gradualmente conforme o ecossistema cresce
e LTD ganha valor de mercado:

| Fase             | Trigger                | Multiplicador | Cap diário |
|------------------|------------------------|---------------|------------|
| Testnet (atual)  | <100 mineradores ativos | 1.0x (base)   | 500 LTD    |
| Pre-mainnet      | 100+ mineradores ativos | 0.5x          | 500 LTD    |
| Mainnet          | TGE / exchange listing  | 0.25x         | 300 LTD    |
| Maturidade       | 5,000+ mineradores ativos| 0.1x         | 200 LTD    |

Cada fase reduz a emissão em ~50%. O multiplicador é aplicado sobre as
recompensas base de cada tier. A transição entre fases é governada pela
equipe durante a testnet, e por propostas de governança on-chain na
mainnet.

### 6.3.5 Progressão do Ecossistema

La Tanda foi desenhada como uma escada de participação onde cada nível
oferece maiores benefícios:

1.  **Usuário:** Registra-se, minera LTD diariamente (Bronze, 1 LTD/dia)
2.  **Minerador ativo:** Sobe de nível por atividades e sequências (Prata/Ouro,
    3-5 LTD/dia)
3.  **Membro de Tanda:** Participa em poupança em grupo, ganha conquista   
    de vendedor + acesso financeiro
4.  **Vendedor:** Vende no mercado, ganha comissões + conquistas de 
    vendedor
5.  **Delegador:** Faz bridge de LTD para a chain, delega a validador, ganha
    block rewards + vota em governança
6.  **Validador:** Opera o nó, valida blocos, recebe delegação
    (2,000-5,000 LTD)
7.  **Investidor:** Aporta capital pre-TGE, obtém tokens com                desconto e
    vesting

## 6.4 Assinaturas

| Plano    | Preço   | Benefícios                              |
|----------|---------|----------------------------------------|
| Grátis   | $0      | 1 spin/dia, horário 9pm                 |
| Premium  | $25/mês | 3 spins/dia, todos os horários, histórico  |
| Diamante | $49/mês | Ilimitado, 5 números, acesso API        |

# 7. Segurança

## 7.1 Infraestrutura

-   SSL/TLS 1.2+ obrigatório
-   Rate limiting (nginx + fail2ban)
-   Firewall UFW configurado
-   PostgreSQL/Redis apenas localhost

## 7.2 Aplicação

-   JWT com expiração (24h/7d)
-   Bcrypt para passwords (12 rounds)
-   Sanitização de inputs (XSS prevention)
-   Queries parametrizadas (SQL injection prevention)
-   CORS restrito

## 7.3 Headers de Segurança

-   Strict-Transport-Security (HSTS)
-   Content-Security-Policy (CSP)
-   X-Frame-Options: DENY
-   X-Content-Type-Options: nosniff

## 7.4 Compliance

-   KYC/AML para verificação de identidade
-   Avaliação PCI-DSS concluída
-   Logs de auditoria imutáveis

# 8. La Tanda Chain

La Tanda começou como uma plataforma para digitalizar tandas e     
evoluiu para um ecossistema financeiro completo: poupança em grupo,
mercado P2P, predições com ML, mineração de tokens, assistente IA e
governança comunitária. La Tanda Chain é a camada de infraestrutura     que 
unifica esses serviços sob uma rede descentralizada e soberana.

**Fase 1:** LTD como ERC20 na Polygon (atual)  
**Fase 2:** La Tanda Chain — blockchain soberana construída com Cosmos
SDK / CometBFT onde LTD é o token nativo de gas, staking e 
governança.

## 8.1 Arquitetura da Cadeia

La Tanda Chain utiliza **CometBFT** (anteriormente Tendermint) como motor
de consenso, proporcionando tolerância a falhas bizantinas, finalidade
instantânea e Proof of Stake delegado (DPoS).

5s

Tempo de bloco

1,000+

TPS objetivo

BFT

Consenso

IBC

Interoperabilidade

### Módulos nativos da cadeia

| Módulo           | Função                                                                                                                |
|------------------|-----------------------------------------------------------------------------------------------------------------------|
| **x/ltd**        | Token nativo — transferências, burns, fees.     Supply fixo 200M (0% inflação). Recompensas via treasury pré-mintado       |
| **x/tanda**      | Ciclos de tandas, contribuições, pagamentos, resultados de sorteio. Multi-sig para distribuição                         |
| **x/mercado**    | Escrow de mercado, reputação de vendedores, arbitragem de disputas                                                |
| **x/loteria**    | RNG verificável (commit-reveal), scheduling de sorteios, mercado de       predições                                       |
| **x/mineria**    | Recompensas por atividade, tiers, anti-sybil, distribuição programada a partir do  treasury                                  |
| **x/governanza** | Propostas, votação (1 LTD = 1 voto, 1.5x se    staking >180d), quorum     33%                                             |

### On-chain vs Off-chain

| On-chain (La Tanda Chain)           | Off-chain (PostgreSQL + Redis) |
|-----------------------------------|--------------------------------|
| Transferências e saldos LTD         | Perfis de usuário, PII, KYC    |
| Criação de tandas, regras, pagamentos | Feed social, comentários, chat |
| Escrow de marketplace               | Conversas com MIA (IA)         |
| Provas de RNG para sorteios         | Modelos ML de predição         |
| Staking, governança, mineração      | Sessões, analytics, UI         |

## 8.2 Participantes da Rede

### Nós

Qualquer máquina que executa o software da La Tanda Chain. Os nós
mantêm uma cópia do estado e retransmitem transações.

| Tipo           | Papel                                                         | Operador                           |
|----------------|-------------------------------------------------------------|------------------------------------|
| Full Node      | Histórico completo, valida transações, serve consultas      | Ray-Banks, parceiros, desenvolvedores |
| Validator Node | Full node + participa do consenso (propõe e assina blocos)  | Validadores qualificados            |
| Archive Node   | Full node + retém todo o estado histórico                   | Exploradores de blocos, analytics   |
| Light Client   | Verifica headers, consulta estado via full nodes            | Wallets móveis, integrações         |

### Validadores

Operadores de nó admitidos ao conjunto ativo que participam da      
produção de blocos.

| Requisito    | Detalhe                                                        |
|--------------|-----------------------------------------------------------------|
| Stake mínimo | 1 LTD self-delegation mínima (testnet: delegação do projeto)   |
| Histórico    | 6+ meses ativo na La Tanda                                     |
| Verificação  | KYC/KYB concluído                                              |
| Uptime       | 99.5%+ por época (10,000 blocos)                               |
| Governança   | Votar em 75%+ das propostas                                    |

**Conjunto de validadores (expansão progressiva):**

| Fase                                | Validadores | Seleção                                                 |
|------------------------------------|-------------|---------------------------------------------------------|
| Fase 1 — Genesis (concluída)        | 7+          | Concluída: 7+ validadores ativos, governança on-chain |
| Fase 2 — Trusted Set (em progresso) | 15-25       | Testnet  incentivada: validadores + infra partners       |
| Fase 3 — Crescimento               | 50          | Aplicações   abertas, por stake                        |
| Fase 4 — Maturidade                 | 100         | Sem permissão, por stake                                |
| Fase 5 — Aberta                   | 150+        | Sem limite, mercado  livre                               |

### Condições de Slashing

| Ofensa                                             | Penalidade                                  |
|---------------------------------------------------|-------------------------------------------|
| Dupla assinatura (assinar 2 blocos na mesma altura) | 5% do stake +  jail permanente               |
| Downtime prolongado (500+ blocos perdidos)         | 0.1% do stake + jail temporário (24h)       |
| Má conduta em tanda (falha de distribuição)        | 10% do bônus do coordenador + remoção       |
| Abstenção de governança (<50% votos em 3 meses)    | Advertência → 0.05% slash em reincidência   |

### Delegadores

Qualquer holder de LTD que faz staking de tokens em um validador,
compartilhando recompensas e riscos.

1.  O delegador escolhe um validador segundo reputação, comissão e uptime
2.  Faz staking de LTD via transação `MsgDelegate`
3.  Os LTD em staking contribuem para o peso do validador
4.  O delegador ganha recompensas proporcionais, menos a comissão do
    validador
5.  Pode redelegar para outro validador (período de unbonding: 21 dias)

**Delegação no contexto do ecossistema:**  
Entrar em um grupo de tanda = delegação implícita ao
coordenador-validador.  
Comprar no marketplace = delegação temporária de confiança.  
Staking em um validador = delegação econômica explícita de longo prazo.

## 8.3 Migração de Token: Polygon → La Tanda Chain

LTD existe atualmente como ERC20 na Polygon Amoy testnet. A migração
para token nativo da La Tanda Chain segue esta rota:

1.  **Testnet Ativa (Q1-Q2 2026):** La Tanda Chain testnet em       
    produção com 10+ validadores, governança on-chain, testnet       
    incentivada (ver 8.3.1)
2.  **Seed Round + Equipe (Q2-Q3 2026):** Fechamento da rodada seed,
    contratação da equipe core, auditoria de segurança
3.  **Mainnet Launch + TGE (Q1-Q2 2027):** Mainnet lançada como chain
    nova com genesis independente, Token Generation Event, primeiro
    listing DEX, IBC habilitado
4.  **Expansão (Q3-Q4 2027):** CEX listing, expansão regional
    (Guatemala, El Salvador), módulos nativos ativos

### 8.3.1 Estratégia Testnet → Mainnet

Testnet (`latanda-testnet-1`) e mainnet (`latanda-1`, pendente) são
chains tecnicamente separadas. A estratégia oficial é a seguinte:

-   **Testnet mantém seus parâmetros atuais:** 5% de inflação de           
    bloco (valor herdado do genesis experimental) é preservado como   
    sandbox de desenvolvimento. Não será executada proposta de governança para
    modificar parâmetros de testnet — mudar regras mid-game gera
    fricção desnecessária com validadores ativos.
-   **Mainnet nasce limpa com o modelo oficial:** 200M fixo, 0%
    inflação real, recompensas a partir do pool Staking e Validadores
    pré-mintado. Testnet pode continuar rodando em paralelo       
    pós-launch ou ser descontinuada conforme a necessidade da comunidade.
-   **Os tokens de testnet não migram automaticamente:** são play money
    de desenvolvimento, não são herdados no genesis da mainnet.

### 8.3.2 Programa Testnet incentivado 

Os validadores, nós e colaboradores ativos durante testnet recebem
compensação em LTD *real* no genesis da mainnet, financiada a partir      do
pool **Comunidade e Mineração**. Seu trabalho na testnet se converte
diretamente em participação de mainnet:

| Tier                 | Slots   | LTD por slot | Total         | Requisitos                                         |
|----------------------|---------|--------------|---------------|----------------------------------------------------|
| **Infra Partner**    | 5       | 5,000        | 25,000        | RPC/  API público, explorer, statesync, guia técnico |
| **Validator**        | 10      | 2,000        | 20,000        |    Uptime \>95%, votar em governança, sem jailing     |
| **Full Node**        | 20      | 500          | 10,000        | Nó sincronizado, relay de transações               |
| **Bug Reporter**     | Aberto  | 100-1,000    | \~10,000      | Relatório verificado via GitHub issue              |
| **Buffer adicional** | —       | —            | \~35,000      | Reserva para novos participantes até mainnet    |
| **TOTAL**            |         |              | **\~100,000** | 0.    05% do supply total                             |

Este programa substitui qualquer necessidade de modificar os parâmetros
da testnet via governança. Os validadores externos que contribuíram     para
o bootstrap da rede recebem sua compensação na mainnet como
reconhecimento explícito do valor aportado, em vez de depender de
recompensas inflacionárias de testnet que não teriam valor econômico
real.

## 8.4 Economia de Validadores

| Fonte de Receita                    | Distribuição                                  |
|-------------------------------------|-----------------------------------------------|
| Fees de transação (0.01 LTD base)   | Validadores 80% \| Tesouraria   15% \| Burn 5%   |
| Comissões de tanda                 | Coordenador 85% \| Tesouraria    10% \| Burn 5%   |
| Fees de mercado                 | Árbitros 50% \| Tesouraria          30% \| Burn 20%     |
| Assinaturas de loteria            | Tesouraria 70% \| Oráculos 20%     \| Burn 10%     |
| Fees de bridge (0.1%)               | Validadores 60% \| Tesouraria   30% \| Burn 10%  |

**APY estimado:** Validadores 15-25% \| Delegadores 10-20% (varia segundo
a comissão do validador e a atividade da rede). Fonte: fees de
transação + distribuição programada do treasury pré-mintado (40M LTD
alocados para staking/validadores). Sem inflação — supply fixo de
200M.

## 8.5 Interoperabilidade

-   **IBC (Cosmos):** Conexão com Osmosis (DEX), Noble (USDC nativo),
    Cosmos Hub
-   **Polygon Bridge:** Composabilidade DeFi, listings em exchanges,
    integrações legacy
-   **Rampas Fiat:** Transferência bancária / dinheiro móvel ↔ LTD via
    parceiros regulados em Honduras e LATAM

## 8.6 Segurança da Cadeia

-   **Consenso:** CometBFT tolera \<1/3 validadores bizantinos.
    Finalidade de 5 segundos
-   **Staking:** Delegação do projeto durante testnet. Mainnet       
    exigirá stake significativo como desincentivo econômico
-   **Bridge:** Verificação light client IBC (sem intermediários).      Rate
    limit: max 1M LTD/24h. Pausa de emergência via governança
-   **Privacidade:** Montantes on-chain visíveis apenas para participantes 
    e validadores designados. ZK-SNARKs planejados para Fase 4
-   **Auditorias:** Smart contracts e módulos auditados por 2+ firmas
    independentes antes de cada fase

# 9. Roadmap Integral

## Concluído (2024-2025)

-   Infraestrutura core e API (140+ endpoints)
-   Sistema de tandas com WebSocket e loterias comunitárias ao vivo
-   LTD Token na Polygon Amoy (ERC20)
-   Preditor de loteria com ML (XGBoost, 42% precisão)
-   Sistema de mineração, gamificação e mercado
-   MIA — assistente financeiro de IA

## Q1-Q2 2026 — Plataforma

-   OAuth (Google, Apple, Telegram)
-   Integração de pagamentos (Stripe)
-   App móvel (React Native)
-   Auditoria de smart contracts
-   Hash anchors de pagamentos (SHA-256 para futura migração on-chain)
-   Sistema de reputação na plataforma

## Q1-Q2 2026 — Testnet Ativa (em progresso)

-   La Tanda Chain testnet com 10+ validadores (validators) ativos
-   Testnet incentivada com tiers de delegação (Validator 2K, Infra
    Partner 5K LTD)
-   Governança on-chain ativa (GOV-001, GOV-002 aprovadas)
-   Bug bounty e grants para contribuidores
-   Software de nó e documentação open-source

## Q2-Q3 2026 — Seed Round + Equipe

-   Fechamento da rodada seed ($500K, FDV $5M)
-   Contratação da equipe core (5 pessoas)
-   Auditoria de segurança (chain + plataforma)
-   25+ validadores em testnet
-   Dual-write: PostgreSQL + chain testnet em paralelo

## Q1-Q2 2027 — Mainnet Launch + TGE

-   Migração de testnet para mainnet
-   Token Generation Event (TGE — 10M LTD circulante)
-   Primeiro listing DEX (Osmosis ou similar)
-   IBC habilitado, staking de delegadores aberto
-   A chain se torna a fonte da verdade

## Q3-Q4 2027 — Expansão

-   50 validadores ativos em 10+ países
-   SDK da La Tanda para desenvolvedores terceiros
-   Tandas transfronteiriças (settlement em LTD ou USDC via IBC)
-   Papéis especializados: validadores de tanda, árbitros de
    mercado, oráculos
-   Conexões IBC: Osmosis (DEX), Noble (USDC)

## 2028 — Fase 4: Maturidade

-   100+ validadores, entrada sem permissão
-   Tesouraria DAO ativa — fees do protocolo controlados pela
    comunidade
-   Fundo de seguro operacional
-   Integrações DeFi (posições de tanda como colateral)
-   API empresarial: bancos e microfinanceiras integram
    tanda-as-a-service
-   Fundação La Tanda estabelecida

## 2029+ — Fase 5: Protocolo Aberto

-   150+ validadores, sem limite
-   Chains satélite regionais conectadas via IBC (África, Ásia)
-   Suporte multi-modelo: chit funds (Índia), susu (África), hui
    (Vietnã), paluwagan (Filipinas)
-   Interoperabilidade com finanças tradicionais (cartões, remessas)
-   DAO completamente autônoma com conselho eleito para emergências

[Ver roadmap detalhado →](roadmap.html)

# 10. Equipe e Legal

## 10.1 Entidade Legal

**Ray-Banks LLC**  
New Mexico Limited Liability Company  
EIN: 37-2158338  
Operando como: Latanda Financial Services

## 10.2 Equipe Fundadora

La Tanda é desenvolvida por uma equipe distribuída liderada pelo
fundador, com funções-chave sendo recrutados ativamente por meio do
programa de bounties e da comunidade Cosmos.

| Papel                                   | Estado     | Alocação       (Pool Equipe) |
|---------------------------------------|------------|--------------------------|
| **Fundador / Arquiteto**              | Ativo     | 8,000,000 LTD            |
| **Líder de Infraestrutura**           | Recrutando | 2,500,000 LTD            |
| **Desenvolvedor Frontend**            | Recrutando | 2,500,000 LTD            |
| **Comunidade / Crescimento**          | Recrutando | 2,000,000 LTD            |
| **Desenvolvedor Mobile**              | Post-Seed  | 2,500,000 LTD            |
| **CTO / Desenvolvedor Backend+Chain** | Post-Seed  | 4,000,000 LTD            |
| **Designer / UX**                     | 2027       | 1,500,000 LTD            |
| **Reserva**                           | \-          | 1,000,000 LTD            |

**Vesting:** Todos os papéis da equipe têm 1 ano de cliff e 2 anos de
vesting linear. Total do pool Equipe: 24,000,000 LTD (12% do        
supply).

**Junte-se à equipe:** Os melhores contribuidores do [programa de
bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)
são convidados para papéis de equipe. Também aceitamos candidaturas diretas 
para papéis especializados. Contato: <contact@latanda.online>

## 10.3 Validadores e Parceiros de Infraestrutura

| Operador                         | Estado | Desde        |
|----------------------------------|--------|--------------|
| **Ray-Banks** (genesis)          | Ativo | Fevereiro 2026 |
| **PRO Delegators** (Nuxian Labs) | Ativo | Março 2026   |

## 10.4 Contato

-   **Website:** [latanda.online](https://latanda.online)
-   **Corporate:** [raybanks.org](https://raybanks.org)
-   **Email:** contact@latanda.online
-   **GitHub:**
    [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/    la-tanda-web)
-   **Twitter:** @TandaWeb3
-   **Investors:** [latanda.online/invest](/invest.html) \|
    <invest@latanda.online>

## 10.5 Disclaimer

Este documento é apenas para fins informativos e não constitui
aconselhamento financeiro, legal ou de investimento. Os tokens LTD
atualmente operam em testnet e não têm valor monetário. Investir em
criptomoedas envolve riscos significativos. Consulte          
profissionais antes de tomar decisões financeiras.

2024-2026 Ray-Banks LLC. Todos os direitos reservados.

[Roadmap](roadmap.html) \| [Privacidade](privacy-policy.html) \|
[Termos](terms-of-service.html) \| [API
Docs](https://latanda.online/docs)
