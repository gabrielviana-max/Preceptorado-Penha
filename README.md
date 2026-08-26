# Quadro da Obra de Deus — Preceptorado Nossa Senhora da Penha

Aplicação web para manter o Quadro da Obra de Deus atualizado pelos próprios irmãos.

## O que já está implementado

- Quadro Geral com totais automáticos por Hora Litúrgica e dia.
- Totais de Missa Ferial.
- Área com os irmãos cadastrados.
- Formulário para atualizar o próprio quadro.
- Dados iniciais baseados no último quadro fornecido.
- Rafael não é incluído.
- Alterações do Michel já incorporadas:
  - Domingo: Completas
  - Segunda: Laudes
  - Terça: Ofício das Leituras
  - Quarta: Nona
  - Quinta: Terça
  - Sexta: Sexta
  - Sábado: Vésperas
  - Missa: Terça-feira

## Rodar localmente

1. Instale Node.js 20+.
2. `npm install`
3. Copie `.env.example` para `.env`.
4. Preencha as credenciais do Supabase.
5. Execute o `supabase.sql` no SQL Editor do Supabase.
6. `npm run dev`

Sem Supabase configurado, o site funciona em modo local usando `localStorage`, útil para teste.

## Colocar online

O projeto pode ser publicado no Vercel, Netlify ou outro serviço compatível com Vite.

Para uso real por vários irmãos, configure o Supabase. O próximo passo recomendado é ativar autenticação individual (e-mail/magic link ou Google) e restringir cada usuário à própria linha na tabela `members`. A política aberta do SQL é adequada apenas para protótipo; antes de uso público, substitua-a por políticas RLS baseadas em `auth.uid()`.

## Exportação

A estrutura está pronta para acrescentar um botão "Exportar PDF" que gere o Quadro Geral a partir dos mesmos totais exibidos no site.
