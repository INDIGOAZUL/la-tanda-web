<!--
Whitepaper La Tanda v2.1 — tradução para português brasileiro.
Source: es.md (fonte canônica em espanhol), sincronizado em 2026-10-11 com a v2.1.
Tradução original da v2.0 por contribuidores da comunidade; estrutura e conteúdo realinhados com es.md v2.1.
Workflow: ver ../README.md.
NÃO editar es.md. Tradução mantida apenas em pt-br.md.
-->

Documento de design, não descreve o produto em operação. Menciona
componentes não ativos (contratos de custódia, módulos de cadeia
planejados) e um protótipo EVM já desativado; La Tanda não custodia
fundos nem concede crédito.

La Tanda

Whitepaper Técnico v2.1

Fevereiro 2026 (atualizado em 11 de outubro de 2026) \| Ray-Banks LLC

## Conteúdo

- [1. Resumo Executivo](#abstract)
- [2. O Problema](#problem)
- [3. A Solução](#solution)
- [4. Tecnologia](#technology)
- [5. Tokenomics](#tokenomics)
- [6. Funcionalidades](#features)
- [7. Segurança](#security)
- [8. La Tanda Chain](#chain)
- [9. Roadmap](#roadmap)
- [10. Equipe e Jurídico](#team)

# 1. Resumo Executivo

La Tanda é uma plataforma Web3 que digitaliza e aprimora o sistema
tradicional de tandas (associações rotativas de poupança e crédito)
por meio de tecnologia blockchain, democratizando o acesso a serviços
financeiros para comunidades desassistidas.

**Missão:** Construir a plataforma financeira Web3 mais acessível do
mundo, combinando a confiança das tandas tradicionais com a
transparência e a segurança da blockchain.

1.7B

Pessoas sem acesso bancário

\$500B+

Mercado global de ROSCAs

Cosmos SDK

Cadeia própria (testnet)

200M

LTD de genesis (design da mainnet)

# 2. O Problema

## 2.1 Exclusão Financeira

Segundo o Banco Mundial, 1,7 bilhão de adultos não têm acesso a
serviços bancários. Na América Latina, 45% da população é
sub-bancarizada e depende de sistemas informais para poupança e
crédito.

## 2.2 Limitações das Tandas Tradicionais

- **Confiança:** Dependem de relações pessoais, o que limita o alcance
- **Transparência:** Sem registros verificáveis das transações
- **Escala:** Difícil crescer além das comunidades locais
- **Segurança:** Risco de inadimplência sem garantias
- **Acesso:** Exigem presença física e coordenação manual

## 2.3 Barreiras da Web3

As soluções DeFi existentes são complexas demais para usuários não
técnicos, com interfaces intimidantes, taxas de gas imprevisíveis e
riscos de segurança.

# 3. A Solução: La Tanda

La Tanda combina o melhor dos dois mundos: a familiaridade e a confiança
das tandas tradicionais com a segurança, a transparência e o alcance
global da blockchain.

## 3.1 Proposta de Valor

| Característica | Tanda Tradicional      | La Tanda Web3         |
|----------------|------------------------|-----------------------|
| Alcance        | Local (10-20 pessoas)  | Global (sem limite)   |
| Transparência  | Verbal/papel           | Registro digital compartilhado com o grupo |
| Segurança      | Confiança pessoal      | Histórico e reputação visíveis (sem garantia nem seguro) |
| Pagamentos     | Dinheiro/banco         | Dinheiro ou transferência entre membros; La Tanda só registra |
| Recompensas    | Nenhuma                | LTD de testnet (sem valor monetário) |

## 3.2 Como Funciona

1.  **Criar/Entrar:** O usuário cria uma tanda ou entra em uma existente
2.  **Contribuir:** Cada membro entrega sua contribuição (dinheiro ou
    transferência) e quem coordena o grupo a registra na plataforma
3.  **Sorteio:** Sistema de tômbola ao vivo determina os turnos
4.  **Receber:** O membro recebe o pote no seu turno
5.  **Ganhar:** Tokens LTD por participação e pontualidade

# 4. Arquitetura Técnica

## 4.1 Stack Tecnológico

| Camada                       | Tecnologia                                                                              |
|------------------------------|-----------------------------------------------------------------------------------------|
| Frontend                     | HTML5, CSS3, JavaScript (Vanilla + PWA)                                                 |
| Backend                      | Node.js (HTTP nativo), PM2 cluster                                                      |
| Banco de Dados               | PostgreSQL 16                                                                           |
| Cache                        | Redis                                                                                   |
| Blockchain                   | La Tanda Chain (Cosmos SDK / CometBFT), testnet `latanda-testnet-1` desde fevereiro 2026 |
| Módulos da cadeia            | Cosmos SDK (Go)                                                                         |
| Assistente IA                | MIA (web e Telegram)                                                                    |
| Histórico (2025, desativado) | Protótipo EVM na Polygon Amoy (Solidity)                                                |

## 4.2 API RESTful

API REST documentada em [latanda.online/docs](https://latanda.online/docs/) (Swagger).
Categorias principais:

- **Auth:** Login, registro, verificação de e-mail, tokens
- **Wallet:** Saldo de LTD de testnet e histórico
- **Groups/Tandas:** CRUD, membros, turnos, tômbola, registro de
  contribuições e pagamentos de turno
- **Admin:** Usuários, moderação, auditoria
- **Mining:** Recompensas diárias, tiers, conquistas

## 4.3 Token LTD e protótipo EVM (histórico)

Hoje o LTD é o token nativo da La Tanda Chain (`latanda-testnet-1`,
denominação `ultd`). É um token de testnet sem valor monetário.

Em 2025 foi construído um protótipo EVM na Polygon Amoy (testnet) com
três contratos: **TandaToken.sol** (ERC20), **TandaGroup.sol** (grupos e
contribuições) e **TandaEscrow.sol** (custódia programada). Esse
protótipo foi desativado com a passagem para a cadeia própria em
fevereiro de 2026 e não é usado.

Histórico, sem valor: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc (ERC20
do protótipo na Polygon Amoy, desativado)

# 5. Tokenomics

## 5.1 LTD Token

LTD (La Tanda Dollar) é o token de utilidade nativo da plataforma.

**Supply fixo + 0% de inflação real.** O supply total de 200M LTD
permanece fixo para sempre na mainnet (chain alvo `latanda-1`; meta
interna Q1-2027, condicionada a assessoria jurídica; não é
compromisso). As recompensas para validadores e mineradores NÃO vêm de
inflação, e sim do pool pré-mintado de 40M LTD (Staking e Validadores),
distribuído em uma curva de ~5 anos.  
  
**Testnet atual (`latanda-testnet-1`): 0% de inflação desde a GOV-004
(setembro de 2026).** Entre abril e setembro de 2026 rodou com 5% de
inflação de teste (GOV-003), que distorceu as recompensas e foi revertida;
por isso o supply da testnet é hoje ~204.4M LTD (200M no genesis). No
genesis da mainnet,
`inflation_min = inflation_max = 0.0`. Especificação completa: ITP-SPEC
§6 (documento técnico em preparação).

200M

Supply de genesis

Nativo

Token da cadeia

La Tanda Chain

Blockchain (testnet)

## 5.2 Distribuição

| Categoria                    | %   | Tokens     | Vesting                                        |
|------------------------------|-----|------------|------------------------------------------------|
| Comunidade e Mineração       | 30% | 60,000,000 | Emissão em 5 anos via participação             |
| Staking e Validadores        | 20% | 40,000,000 | Delegação programada + recompensas de bloco    |
| Fundo de Desenvolvimento     | 12% | 24,000,000 | 6 meses de cliff, 3 anos linear                |
| Equipe e Fundadores          | 12% | 24,000,000 | 1 ano de cliff, 2 anos linear                  |
| Marketing e Alianças         | 6%  | 12,000,000 | Trimestral por marcos                          |
| **Seed Round**               | 5%  | 10,000,000 | 6 meses de cliff, 18 meses linear              |
| **Strategic / Private Sale** | 5%  | 10,000,000 | 3 meses de cliff, 12 meses linear              |
| Liquidez Inicial (TGE)       | 5%  | 10,000,000 | Disponível no TGE                              |
| Bug Bounties e Grants        | 3%  | 6,000,000  | Via propostas de governança                    |
| Fundo de Seguro              | 2%  | 4,000,000  | Somente via voto de emergência                 |

**Circulante Inicial (TGE):** 10,000,000 LTD (5% do total). Os
190,000,000 restantes são liberados progressivamente segundo o
calendário de vesting ao longo de 5 anos. Os tokens de Seed e Strategic
Round estão sujeitos a cliff e vesting, protegendo o preço pós-TGE.

## 5.3 Utilidade do Token

- **Staking:** Bloquear LTD para obter benefícios premium
- **Governança:** Votar em propostas da plataforma
- **Descontos:** Redução de comissões ao pagar com LTD
- **Acesso:** Funções exclusivas para holders
- **Recompensas:** Ganhar LTD por atividade na plataforma

# 6. Funcionalidades

## 6.1 Sistema de Tandas

- Criar grupos com configuração flexível
- Múltiplas posições por membro
- Tômbola ao vivo com WebSocket
- Bloqueio de posições para coordenadores
- Comissão opcional do coordenador (100% para o coordenador; La Tanda
  não cobra comissão)

## 6.2 Sistema de Mineração

Qualquer usuário registrado pode minerar LTD diariamente. A recompensa
depende do tier alcançado por meio de achievement points — pontos que
se acumulam por atividade real na plataforma (verificar e-mail,
participar de tandas, pagar em dia, indicar usuários etc.).

### 6.2.1 Tiers de Mineração

| Tier     | Pontos necessários | Recompensa base/dia | Bônus de sequência máx. |
|----------|--------------------|---------------------|-------------------------|
| Bronze   | 0-49               | 1.0 LTD             | +2.0 LTD                |
| Prata    | 50-149             | 3.0 LTD             | +4.0 LTD                |
| Ouro     | 150-299            | 5.0 LTD             | +7.0 LTD                |
| Platina  | 300-499            | 8.0 LTD             | +10.0 LTD               |
| Diamante | 500+               | 12.0 LTD            | +15.0 LTD               |

### 6.2.2 Achievement Points

Os pontos se acumulam automaticamente ao completar conquistas. Há 20
conquistas em 7 categorias:

- **Conta:** E-mail verificado (10 pts)
- **Participação:** Primeira tanda (20 pts), tanda concluída (25 pts)
- **Financeiro:** L.1000+ contribuídos (15 pts), L.10,000+ (40 pts),
  pontualidade perfeita (35 pts)
- **Social:** Primeiro post (10 pts), 10 seguidores (15 pts), indicações
  (15-30 pts)
- **Marketplace:** Vendedor estrela — 5+ vendas com avaliação 4+ (30 pts)
- **Verificação:** KYC básico (25 pts), KYC avançado (50 pts)
- **Engajamento:** Sequência de 7 dias (10 pts), sequência de 30 dias
  (30 pts)

Um usuário típico que verifica o e-mail, participa de uma tanda e
minera 7 dias seguidos alcança Prata (50+ pts). Alcançar Ouro ou acima
exige engajamento contínuo.

### 6.2.3 Emissão e Limites

- **Cap diário global:** 500 LTD/dia no máximo entre todos os
  mineradores (testnet)
- **Cooldown individual:** 24 horas entre claims
- **Pool de emissão:** 60M LTD (30% do supply) distribuído em 5 anos
  via participação
- **Antiabuso:** registro de IP por claim, limite de 24 h, tetos
  diário e vitalício

### 6.2.4 Modelo de Scaling Progressivo

As recompensas diminuem gradualmente à medida que o ecossistema cresce
e o LTD ganha valor de mercado:

| Fase             | Gatilho                     | Multiplicador | Cap diário |
|------------------|-----------------------------|---------------|------------|
| Testnet (atual)  | \<100 mineradores ativos    | 1.0x (base)   | 500 LTD    |
| Pré-mainnet      | 100+ mineradores ativos     | 0.5x          | 500 LTD    |
| Mainnet          | TGE / listagem em exchange  | 0.25x         | 300 LTD    |
| Maturidade       | 5,000+ mineradores ativos   | 0.1x          | 200 LTD    |

Cada fase reduz a emissão em ~50%. O multiplicador se aplica sobre as
recompensas base de cada tier. A transição entre fases é governada pela
equipe durante a testnet e por propostas de governança on-chain na
mainnet.

### 6.2.5 Progressão do Ecossistema

La Tanda foi desenhada como uma escada de participação em que cada
nível oferece mais benefícios:

1.  **Usuário:** Registra-se, minera LTD diariamente (Bronze, 1 LTD/dia)
2.  **Minerador ativo:** Sobe de tier por atividade e sequências
    (Prata/Ouro, 3-5 LTD/dia)
3.  **Membro de Tanda:** Participa da poupança em grupo, ganha
    conquistas + acesso financeiro
4.  **Vendedor:** Vende no marketplace, ganha comissões + conquistas de
    vendedor
5.  **Delegador:** Delega LTD a um validador na La Tanda Chain, recebe
    recompensas de bloco + vota em governança
6.  **Validador:** Opera um nó, valida blocos, recebe delegação
    (2,000-5,000 LTD)
7.  **Investidor:** Aporta capital pré-TGE, obtém tokens com desconto e
    vesting

# 7. Segurança

## 7.1 Infraestrutura

- SSL/TLS 1.2+ obrigatório
- Rate limiting (nginx + fail2ban)
- Firewall UFW configurado
- PostgreSQL/Redis somente em localhost

## 7.2 Aplicação

- JWT com expiração (24h/7d)
- Bcrypt para senhas (12 rounds)
- Sanitização de inputs (prevenção de XSS)
- Queries parametrizadas (prevenção de SQL injection)
- CORS restrito

## 7.3 Headers de Segurança

- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

## 7.4 Compliance

- Verificação de identidade (KYC): não ativa. Se algum dia os pagamentos
  passarem pela plataforma, ela será feita por um parceiro de pagamentos
  licenciado
- Logs de auditoria de ações sensíveis (login, alterações de conta,
  ações de administração)

# 8. La Tanda Chain

La Tanda começou como uma plataforma para digitalizar tandas. Evoluiu
para um ecossistema financeiro completo: poupança em grupo, marketplace
P2P, mineração de tokens, assistente de IA e governança comunitária. A
La Tanda Chain é a camada de infraestrutura que unifica esses serviços
sob uma rede descentralizada e soberana.

**Hoje (desde fevereiro de 2026):** La Tanda Chain — blockchain soberana
construída com Cosmos SDK / CometBFT, onde o LTD é o token nativo de
gas, staking e governança. Roda como testnet (`latanda-testnet-1`); o
LTD de testnet não tem valor monetário.  
**Antes (2025):** protótipo EVM na Polygon Amoy (testnet), desativado.

## 8.1 Arquitetura da Cadeia

A La Tanda Chain utiliza o **CometBFT** (antigo Tendermint) como motor
de consenso, oferecendo tolerância a falhas bizantinas, finalidade
instantânea e Proof of Stake delegado (DPoS).

5s

Tempo de bloco

1,000+

TPS alvo

BFT

Consenso

IBC

Interoperabilidade

### Módulos nativos da cadeia (planejados)

| Módulo           | Função                                                                                                             |
|------------------|--------------------------------------------------------------------------------------------------------------------|
| **x/ltd**        | Token nativo — transferências, burns, fees. Supply fixo de 200M (0% de inflação). Recompensas via treasury pré-mintado |
| **x/tanda**      | Ciclos de tandas, contribuições, pagamentos, resultados de sorteio. Multi-sig para distribuição                    |
| **x/mercado**    | Escrow do marketplace, reputação de vendedores, arbitragem de disputas                                             |
| **x/mineria**    | Recompensas por atividade, tiers, anti-sybil, distribuição programada a partir do treasury                         |
| **x/gobernanza** | Propostas, votação (1 LTD = 1 voto, 1.5x se staking \>180d), quórum de 33%                                         |

### On-chain vs Off-chain

| On-chain (La Tanda Chain, design)     | Off-chain (PostgreSQL + Redis)                    |
|---------------------------------------|---------------------------------------------------|
| Transferências e saldos de LTD        | Perfis de usuário, PII, KYC                       |
| Criação de tandas, regras, pagamentos | Feed social, comentários, chat                    |
| Escrow do marketplace                 | Conversas com a MIA (IA)                          |
| Provas de RNG para sorteios           | Registro de contribuições e pagamentos de turno (hoje) |
| Staking, governança, mineração        | Sessões, analytics, UI                            |

## 8.2 Participantes da Rede

### Nós

Qualquer máquina que executa o software da La Tanda Chain. Os nós
mantêm uma cópia do estado e retransmitem transações.

| Tipo           | Função                                                      | Operador                                  |
|----------------|-------------------------------------------------------------|-------------------------------------------|
| Full Node      | Histórico completo, valida transações, atende consultas     | Ray-Banks, parceiros, desenvolvedores     |
| Validator Node | Full node + participa do consenso (propõe e assina blocos)  | Validadores qualificados                  |
| Archive Node   | Full node + retém todo o estado histórico                   | Exploradores de blocos, analytics         |
| Light Client   | Verifica headers, consulta o estado via full nodes          | Carteiras móveis, integrações             |

### Validadores

Operadores de nó admitidos no conjunto ativo que participam da produção
de blocos.

| Requisito    | Detalhe                                                         |
|--------------|-----------------------------------------------------------------|
| Stake mínimo | 1 LTD de self-delegation mínima (testnet: delegação do projeto) |
| Histórico    | 6+ meses ativo na La Tanda                                      |
| Verificação  | KYC/KYB previsto para a mainnet, sujeito a revisão jurídica; não exigido na testnet |
| Uptime       | 99.5%+ por época (10,000 blocos)                                |
| Governança   | Votar em 75%+ das propostas                                     |

**Conjunto de validadores (expansão progressiva):**

| Fase                                 | Validadores | Seleção                                                 |
|--------------------------------------|-------------|---------------------------------------------------------|
| Fase 1 — Genesis (concluída)         | 7+          | Concluída: 7+ validadores ativos, governança on-chain   |
| Fase 2 — Trusted Set (em andamento)  | 15-25       | Testnet incentivada: validadores + infra partners       |
| Fase 3 — Crescimento                 | 50          | Inscrições abertas, por stake                           |
| Fase 4 — Maturidade                  | 100         | Sem permissão, por stake                                |
| Fase 5 — Aberta                      | 150+        | Sem limite, mercado livre                               |

### Condições de Slashing

| Infração                                             | Penalidade                                  |
|------------------------------------------------------|---------------------------------------------|
| Dupla assinatura (assinar 2 blocos na mesma altura)  | 5% do stake + jail permanente               |
| Downtime prolongado (500+ blocos perdidos)           | 0.1% do stake + jail temporário (24h)       |
| Má conduta em tanda (falha de distribuição)          | 10% do bônus do coordenador + remoção       |
| Abstenção de governança (\<50% dos votos em 3 meses) | Advertência → 0.05% de slash na reincidência |

### Delegadores

Qualquer holder de LTD que faz staking de tokens com um validador,
compartilhando recompensas e riscos.

1.  O delegador escolhe um validador segundo reputação, comissão e
    uptime
2.  Faz staking de LTD via transação `MsgDelegate`
3.  Os LTD em staking contribuem para o peso do validador
4.  O delegador ganha recompensas proporcionais, menos a comissão do
    validador
5.  Pode redelegar a outro validador (período de unbonding: 21 dias)

**Delegação no contexto do ecossistema:**  
Entrar em um grupo de tanda = delegação implícita ao
coordenador-validador.  
Comprar no marketplace = delegação temporária de confiança.  
Staking com um validador = delegação econômica explícita de longo prazo.

## 8.3 Migração de Token: do protótipo EVM para a La Tanda Chain

A migração já aconteceu: o LTD deixou o protótipo ERC20 na Polygon Amoy
(2025, desativado, sem valor) e desde fevereiro de 2026 é o token
nativo da testnet própria `latanda-testnet-1`. A rota a partir daí:

1.  **Testnet Ativa (desde fevereiro de 2026, em andamento):** La Tanda
    Chain testnet (`latanda-testnet-1`) produzindo blocos desde
    fevereiro de 2026, com validadores ativos, governança on-chain e
    testnet incentivada
2.  **Rodada formal + Equipe (data a definir):** rodada de investimento
    após constituir a C-Corp em Delaware, contratação da equipe core,
    auditoria de segurança
3.  **Mainnet + TGE (meta interna Q1-2027, não é compromisso):**
    Migração da testnet para a mainnet, Token Generation Event, IBC
    habilitado
4.  **Expansão (sem data comprometida):** expansão regional
    (Guatemala, El Salvador), módulos nativos ativos

## 8.4 Economia dos Validadores

| Fonte de Receita                                            | Distribuição                                    |
|-------------------------------------------------------------|-------------------------------------------------|
| Fees de transação (0.01 LTD base)                           | Validadores 80% \| Tesouraria 15% \| Burn 5%    |
| Comissões de tanda (opcionais, acordadas por cada grupo)    | Coordenador 100% (La Tanda não cobra comissão)  |
| Fees do marketplace                                         | Árbitros 50% \| Tesouraria 30% \| Burn 20%      |
| Fees de bridge (0.1%)                                       | Validadores 60% \| Tesouraria 30% \| Burn 10%   |

**Recompensas de staking:** sem número de rendimento publicado; variam
conforme a comissão do validador e a atividade da rede e não são
garantidas. Fonte: fees de transação + distribuição programada do
treasury pré-mintado (40M LTD alocados para staking/validadores). Sem
inflação — supply fixo de 200M.

## 8.5 Interoperabilidade

- **IBC (Cosmos):** Conexão com Osmosis (DEX), Noble (USDC nativo),
  Cosmos Hub
- **Pontes para outras redes:** interoperabilidade (IBC/pontes), sem
  data
- **Rampas Fiat:** transferência bancária / dinheiro móvel, somente por
  meio de um parceiro licenciado; hoje não há nenhum contratado nem data

## 8.6 Segurança da Cadeia

- **Consenso:** O CometBFT tolera \<1/3 de validadores bizantinos.
  Finalidade de ~5-6 segundos
- **Staking:** Delegação do projeto durante a testnet. A mainnet
  exigirá stake significativo como desincentivo econômico
- **Bridge:** Verificação light client IBC (sem intermediários). Rate
  limit: máx. 1M LTD/24h. Pausa de emergência via governança
- **Privacidade:** Valores on-chain visíveis apenas para participantes e
  validadores designados. ZK-SNARKs planejados para a Fase 4
- **Auditorias:** Serão auditados por empresas externas antes da
  mainnet (planejado)

# 9. Roadmap Integral

## Concluído (2024-2025)

- Infraestrutura core e API REST
- Sistema de tandas com WebSocket e tômbola ao vivo
- Protótipo EVM do LTD na Polygon Amoy (ERC20, desativado em 2026)
- Sistema de mineração, gamificação e marketplace
- MIA — assistente financeira de IA

## 2026 — Plataforma (em produção)

- Registro de tandas: contribuições e pagamentos de turno registrados na
  plataforma e confirmados por quem coordena cada grupo (em 11-out-2026: 5 tandas
  criadas, 3 ativas; 3 com pagamentos de turno concluídos; 47 pagamentos
  de turno concluídos)
- 95 usuários registrados em 11-out-2026 (conta criada; não verificados
  por KYC)
- Login com Google e recuperação de conta
- Chat de grupo em tempo real
- Equipes e jornadas para negócios: escala da equipe, jornadas abertas,
  lembretes e registro de presença
- Agenda de horários para serviços: disponibilidade, remarcação,
  lembretes e convites de calendário
- Suíte de negócios gratuita (Mi Negocio): faturamento, relatórios,
  despesas e gerador de documentos
- MIA, assistente de IA (web e Telegram)

## 2026 — Testnet Ativa (em andamento)

- La Tanda Chain testnet (`latanda-testnet-1`) produzindo blocos desde o
  genesis de fevereiro de 2026: mais de 3,5 milhões de blocos em
  11-out-2026
- 51 validadores registrados na cadeia, 35 deles no conjunto ativo (em
  11-out-2026)
- Governança on-chain: 4 propostas aprovadas (GOV-001 a GOV-004,
  mar-set 2026)
- Testnet incentivada com tiers de delegação (Validator 2K, Infra
  Partner 5K LTD)
- Bug bounty e grants para contribuidores
- Software de nó e documentação open-source

Números em 11-out-2026; números ao vivo:
[latanda.online/api/public/metrics](https://latanda.online/api/public/metrics)

## 2026 — Institucional

- Em conversa com o Hub de Inovação Financeira da CNBS (Honduras),
  desde setembro de 2026
- C-Corp em Delaware: em preparação (ainda não constituída)
- Rodada formal de investimento: data a definir

## Próximos passos (sem data comprometida)

- Auditoria de segurança (cadeia + plataforma)
- Contratação da equipe core
- App móvel
- Hash anchors de pagamentos (SHA-256 para futura migração on-chain) e
  dual-write PostgreSQL + chain testnet

## Meta interna Q1-2027 (não é compromisso) — Mainnet + TGE

- Migração da testnet para a mainnet
- Token Generation Event (TGE — 10M LTD em circulação)
- IBC habilitado, staking de delegadores aberto
- A chain passa a ser a fonte de verdade

## Expansão (sem data comprometida)

- 50 validadores ativos em 10+ países
- SDK da La Tanda para desenvolvedores terceiros
- Tandas transfronteiriças (settlement em LTD ou USDC via IBC)
- Papéis especializados: validadores de tanda, árbitros do marketplace,
  oráculos
- Conexões IBC: Osmosis (DEX), Noble (USDC)

## Visão de longo prazo, sem datas nem compromissos — Maturidade

- 100+ validadores, entrada sem permissão
- Tesouraria DAO ativa — fees do protocolo controlados pela comunidade
- Fundo de seguro operacional
- Integrações DeFi (posições de tanda como colateral)
- API empresarial: bancos e microfinanceiras integram tanda-as-a-service
- Fundação La Tanda estabelecida

## Visão de longo prazo, sem datas nem compromissos — Protocolo Aberto

- 150+ validadores, sem limite
- Cadeias satélite regionais conectadas via IBC (África, Ásia)
- Suporte multimodelo: chit funds (Índia), susu (África), hui (Vietnã),
  paluwagan (Filipinas)
- Interoperabilidade com finanças tradicionais (cartões, remessas)
- DAO totalmente autônoma com conselho eleito para emergências

[Ver roadmap detalhado →](roadmap.html)

# 10. Equipe e Jurídico

## 10.1 Entidade Legal

**Ray-Banks LLC**  
New Mexico Limited Liability Company  
EIN: 37-2158338  
Operando como: Latanda Financial Services

## 10.2 Equipe Fundadora

La Tanda é desenvolvida por uma equipe distribuída liderada pelo
fundador, com papéis-chave sendo recrutados ativamente por meio do
programa de bounties e da comunidade Cosmos.

| Função                                  | Status      | Alocação (Pool da Equipe) |
|-----------------------------------------|-------------|---------------------------|
| **Fundador / Arquiteto**                | Ativo       | 8,000,000 LTD             |
| **Líder de Infraestrutura**             | Recrutando  | 2,500,000 LTD             |
| **Desenvolvedor Frontend**              | Recrutando  | 2,500,000 LTD             |
| **Comunidade / Crescimento**            | Recrutando  | 2,000,000 LTD             |
| **Desenvolvedor Mobile**                | Pós-Seed    | 2,500,000 LTD             |
| **CTO / Desenvolvedor Backend+Chain**   | Pós-Seed    | 4,000,000 LTD             |
| **Designer / UX**                       | 2027        | 1,500,000 LTD             |
| **Reserva**                             | \-          | 1,000,000 LTD             |

**Vesting:** Todas as funções da equipe têm 1 ano de cliff e 2 anos de
vesting linear. Total do pool da Equipe: 24,000,000 LTD (12% do supply).

**Junte-se à equipe:** Os melhores contribuidores do [programa de
bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)
são convidados para funções na equipe. Também aceitamos candidaturas
diretas para funções especializadas. Contato: <contact@latanda.online>

## 10.3 Validadores e Parceiros de Infraestrutura

| Operador                         | Status | Desde          |
|----------------------------------|--------|----------------|
| **Ray-Banks** (genesis)          | Ativo  | Fevereiro 2026 |
| **PRO Delegators** (Nuxian Labs) | Ativo  | Março 2026     |

## 10.4 Contato

- **Website:** [latanda.online](https://latanda.online)
- **Corporate:** [raybanks.org](https://raybanks.org)
- **Email:** contact@latanda.online
- **GitHub:**
  [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
- **Twitter:** @TandaWeb3
- **Investors:** [latanda.online/invest](/invest.html) \|
  <invest@latanda.online>

## 10.5 Disclaimer

Este documento tem fins exclusivamente informativos e não constitui
aconselhamento financeiro, jurídico ou de investimento. Os tokens LTD
operam atualmente em testnet e não têm valor monetário. Investir em
criptomoedas envolve riscos significativos. Consulte profissionais
antes de tomar decisões financeiras.

### Histórico de versões

**Outubro de 2026 (v2.1):** Foram retiradas funções que não fazem mais
parte da plataforma pública. Foram corrigidas afirmações que não
refletiam o produto: a verificação de identidade (KYC) não está ativa,
não houve uma avaliação PCI-DSS concluída, os registros de auditoria não
são mais descritos como imutáveis, as rampas fiat não têm parceiro
contratado e foram removidas as contagens de tabelas e endpoints. O
protótipo EVM na Polygon Amoy aparece como histórico (desativado). A
inflação da testnet voltou a 0% (GOV-004). Números em 11-out-2026 a
partir da fonte pública.

**Setembro de 2026:** Esta versão substitui as anteriores. As versões
anteriores incluíam uma estimativa de rendimento (APY) para staking;
essa estimativa foi retirada e não se aplica mais. Enquanto a rede
estiver em testnet, não publicamos números de rendimento: as
recompensas de staking dependerão da comissão do validador e da
atividade da rede, e não são garantidas. O roadmap (seção 9) também foi
atualizado com o estado em setembro de 2026.

2024-2026 Ray-Banks LLC. Todos os direitos reservados.

[Roadmap](roadmap.html) \| [Privacidade](privacy-policy.html) \|
[Termos](terms-of-service.html) \| [API
Docs](https://latanda.online/docs)
