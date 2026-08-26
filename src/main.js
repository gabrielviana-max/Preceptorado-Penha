import { createClient } from "@supabase/supabase-js";
import "./style.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabase =
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes("SEU-PROJETO");

const supabase = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const HOURS = [
  "Ofício das Leituras",
  "Laudes",
  "Terça",
  "Sexta",
  "Nona",
  "Vésperas",
  "Completas"
];

const DAYS = [
  ["domingo", "Domingo"],
  ["segunda", "Segunda-feira"],
  ["terca", "Terça-feira"],
  ["quarta", "Quarta-feira"],
  ["quinta", "Quinta-feira"],
  ["sexta", "Sexta-feira"],
  ["sabado", "Sábado"]
];

const MASS_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

const seed = [
  ["Antonio Luiz","Quarta-feira","Laudes","Terça","Sexta","Nona","Nona","Vésperas","Completas"],
  ["Carlos Albergoni","Sexta-feira","Laudes","Ofício das Leituras","Terça","Completas","Vésperas","Nona","Sexta"],
  ["Danilo Gomes Rosa","Sábado","Ofício das Leituras","Laudes","Terça","Sexta","Nona","Vésperas","Completas"],
  ["David Vieira","Sábado","Ofício das Leituras","Laudes","Terça","Sexta","Nona","Vésperas","Completas"],
  ["Felipe Menezes Soares","Sábado","Completas","Ofício das Leituras","Laudes","Terça","Sexta","Nona","Vésperas"],
  ["Gabriel Viana Gomes","Sábado","Completas","Laudes","Terça","Sexta","Nona","Vésperas","Ofício das Leituras"],
  ["João Gabriel Buso Torro","Sexta-feira","Terça","Sexta","Nona","Vésperas","Ofício das Leituras","Completas","Laudes"],
  ["João Pedro Duarte dos Santos","Quarta-feira","Sexta","Laudes","Terça","Vésperas","Completas","Ofício das Leituras","Nona"],
  ["Jônatas Matheus Lopes Brasileiro","Segunda-feira","Laudes","Terça","Sexta","Nona","Vésperas","Completas","Ofício das Leituras"],
  ["Josimar Rodrigues","Quinta-feira","Terça","Laudes","Vésperas","Completas","Vésperas","Sexta","Ofício das Leituras"],
  ["Junior Ricardo Martins","Quinta-feira","Completas","Ofício das Leituras","Sexta","Nona","Nona","Vésperas","Terça"],
  ["Kelvin de Almeida Soares","Sábado","Ofício das Leituras","Laudes","Terça","Sexta","Nona","Vésperas","Ofício das Leituras"],
  ["Michel","Terça-feira","Completas","Laudes","Ofício das Leituras","Nona","Terça","Sexta","Vésperas"],
  ["Sandro Bueno de Paula","Terça-feira","Ofício das Leituras","Completas","Terça","Sexta","Nona","Terça","Laudes"],
  ["Vinícius Fernandes de Campos","Sábado","Laudes","Nona","Sexta","Vésperas","Completas","Terça","Ofício das Leituras"],
  ["Vinicius Batista da Costa","Sexta-feira","Nona","Vésperas","Completas","Ofício das Leituras","Sexta","Terça","Laudes"],
  ["Willian de Almeida","Quinta-feira","Completas","Ofício das Leituras","Laudes","Terça","Sexta","Nona","Vésperas"]
].map(r => ({
  name: r[0],
  missa_dia: r[1],
  domingo: r[2],
  segunda: r[3],
  terca: r[4],
  quarta: r[5],
  quinta: r[6],
  sexta: r[7],
  sabado: r[8],
  active: true
}));

let members =
  JSON.parse(localStorage.getItem("penha_members") || "null") || seed;

let currentUser = null;
let currentMember = null;

function saveLocal() {
  localStorage.setItem(
    "penha_members",
    JSON.stringify(members)
  );
}

/* =====================================================
   AUTENTICAÇÃO
===================================================== */

async function getSession() {
  if (!supabase) return null;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}

async function loadUser() {

  if (!supabase) return;

  const session = await getSession();

  currentUser = session?.user || null;

  if (!currentUser) {
    currentMember = null;
    return;
  }

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (!error) {
    currentMember = data || null;
  }
}

async function signUp(name, email, password) {

  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  email = email.trim().toLowerCase();

  if (!email.endsWith("@msm.org.br")) {
    throw new Error(
      "O cadastro é permitido somente com e-mail @msm.org.br."
    );
  }

  if (password.length < 6) {
    throw new Error(
      "A senha deve possuir pelo menos 6 caracteres."
    );
  }

  const member = members.find(
    m => m.name.toLowerCase() === name.toLowerCase()
  );

  if (!member) {
    throw new Error(
      "O nome selecionado não foi encontrado no Quadro."
    );
  }

  /*
   * Verifica se o quadro já possui uma conta vinculada.
   */
  const { data: existing, error: existingError } =
    await supabase
      .from("members")
      .select("user_id,email")
      .eq("name", member.name)
      .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.user_id) {
    throw new Error(
      "Este irmão já possui uma conta cadastrada."
    );
  }

  /*
   * Cria a conta.
   *
   * O nome escolhido vai para raw_user_meta_data.
   * O trigger do banco usa esse nome para vincular
   * a conta ao quadro correspondente.
   */
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        member_name: member.name
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function signIn(email, password) {

  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  email = email.trim().toLowerCase();

  if (!email.endsWith("@msm.org.br")) {
    throw new Error(
      "Utilize seu e-mail institucional @msm.org.br."
    );
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw new Error(
      "E-mail ou senha incorretos."
    );
  }

  currentUser = data.user;

  await loadUser();

  return data;
}

async function signOut() {

  if (supabase) {
    await supabase.auth.signOut();
  }

  currentUser = null;
  currentMember = null;

  show("geral");
  render();
}

/* =====================================================
   DADOS
===================================================== */

async function load() {

  if (!supabase) return;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("active", true)
    .order("name");

  if (!error && data?.length) {
    members = data;
  }
}

async function persist(member) {

  saveLocal();

  if (!supabase) return;

  /*
   * Importante:
   * não usamos mais UPSERT.
   *
   * O usuário autenticado só pode atualizar
   * o próprio registro graças à política RLS.
   */
  const { data, error } = await supabase
    .from("members")
    .update({
      missa_dia: member.missa_dia,
      domingo: member.domingo,
      segunda: member.segunda,
      terca: member.terca,
      quarta: member.quarta,
      quinta: member.quinta,
      sexta: member.sexta,
      sabado: member.sabado
    })
    .eq("user_id", currentUser.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      "Não foi possível salvar no servidor: " +
      error.message
    );
  }

  currentMember = data;

  const idx = members.findIndex(
    m => m.user_id === data.user_id
  );

  if (idx >= 0) {
    members[idx] = data;
  }
}

/* =====================================================
   CONTAGENS
===================================================== */

function counts() {

  const c = {};

  HOURS.forEach(h => {
    c[h] = Object.fromEntries(
      DAYS.map(d => [d[1], 0])
    );
  });

  const miss = {};

  members.forEach(m => {

    if (m.missa_dia) {
      miss[m.missa_dia] =
        (miss[m.missa_dia] || 0) + 1;
    }

    DAYS.forEach(d => {

      const h = m[d[0]];

      if (h && c[h]) {
        c[h][d[1]]++;
      }

    });
  });

  return { c, miss };
}

/* =====================================================
   TELA PRINCIPAL
===================================================== */

function render() {

  document.querySelector("#app").innerHTML = `

    <header>

      <div class="brand">✠</div>

      <div>
        <h1>Quadro da Obra de Deus</h1>
        <p>
          Preceptorado Nossa Senhora da Penha · 2026
        </p>
      </div>

    </header>

    <nav>

      <button
        class="active"
        data-view="geral">
        Quadro Geral
      </button>

      <button data-view="irmãos">
        Irmãos
      </button>

      ${
        currentUser
          ? `
            <button data-view="meu-quadro">
              Meu Quadro
            </button>

            <button id="logout">
              Sair
            </button>
          `
          : `
            <button data-view="login">
              Entrar
            </button>
          `
      }

    </nav>

    <main id="content"></main>

    <footer>
      Militia Sanctæ Mariæ ·
      Atualização automática dos totais
    </footer>
  `;

  document
    .querySelectorAll("nav button[data-view]")
    .forEach(button => {

      button.onclick = () => {
        show(button.dataset.view);
      };

    });

  const logout = document.querySelector("#logout");

  if (logout) {
    logout.onclick = signOut;
  }

  show("geral");
}

/* =====================================================
   NAVEGAÇÃO
===================================================== */

function setActive(view) {

  document
    .querySelectorAll("nav button[data-view]")
    .forEach(b => {

      b.classList.toggle(
        "active",
        b.dataset.view === view
      );

    });
}

function show(view) {

  setActive(view);

  const el = document.querySelector("#content");

  if (view === "geral") {

    renderGeneral(el);

  } else if (view === "irmãos") {

    renderMembers(el);

  } else if (view === "login") {

    renderLogin(el);

  } else if (view === "cadastro") {

    renderSignup(el);

  } else if (view === "meu-quadro") {

    renderMyQuadro(el);

  }
}

/* =====================================================
   QUADRO GERAL
===================================================== */

function renderGeneral(el) {

  const { c, miss } = counts();

  el.innerHTML = `

    <section class="intro">

      Este quadro reúne, sem identificação nominal,
      os registros da prática da Liturgia das Horas
      e da participação na Missa ferial no âmbito do
      Preceptorado Nossa Senhora da Penha, organizados
      segundo os dias da semana, em conformidade com
      a Regra da <i>Militia Sanctæ Mariæ</i>.

    </section>

    <div class="cards">

      ${HOURS.map(h => `

        <div class="card">

          <b>${h}</b>

          <strong>
            ${Object.values(c[h])
              .reduce((a, b) => a + b, 0)}
          </strong>

          <span>participações</span>

        </div>

      `).join("")}

    </div>

    <h2>Horas Litúrgicas ao longo da semana</h2>

    <div class="tablewrap">

      <table>

        <thead>

          <tr>
            <th>Hora Litúrgica</th>

            ${DAYS.map(d =>
              `<th>${d[1]}</th>`
            ).join("")}

          </tr>

        </thead>

        <tbody>

          ${HOURS.map(h => `

            <tr>

              <th>${h}</th>

              ${DAYS.map(d => `
                <td>${c[h][d[1]]}</td>
              `).join("")}

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

    <h2>Participação na Missa Ferial</h2>

    <div class="tablewrap">

      <table>

        <thead>
          <tr>
            <th>Dia</th>
            <th>Participações</th>
          </tr>
        </thead>

        <tbody>

          ${MASS_DAYS.map(d => `

            <tr>
              <th>${d}</th>
              <td>${miss[d] || 0}</td>
            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}

/* =====================================================
   IRMÃOS
===================================================== */

function renderMembers(el) {

  el.innerHTML = `

    <h2>Irmãos</h2>

    <p class="muted">
      Consulte os registros do Preceptorado.
      A edição é reservada ao próprio irmão autenticado.
    </p>

    <div class="people">

      ${members.map(m => `

        <article>

          <b>${m.name}</b>

          <span>
            Missa: ${m.missa_dia || "—"}
          </span>

        </article>

      `).join("")}

    </div>
  `;
}

/* =====================================================
   LOGIN
===================================================== */

function renderLogin(el) {

  el.innerHTML = `

    <section class="auth-box">

      <h2>Entrar</h2>

      <p class="muted">
        Acesse sua área do Preceptorado.
      </p>

      <label>
        E-mail institucional

        <input
          id="login-email"
          type="email"
          placeholder="seunome@msm.org.br"
          autocomplete="email"
        />

      </label>

      <label>
        Senha

        <input
          id="login-password"
          type="password"
          placeholder="Sua senha"
          autocomplete="current-password"
        />

      </label>

      <button
        class="primary"
        id="login-button">

        Entrar

      </button>

      <p id="login-message"></p>

      <div class="auth-links">

        <button id="go-signup">
          Ainda não tenho conta
        </button>

      </div>

    </section>
  `;

  document.querySelector("#login-button").onclick =
    async () => {

      const email =
        document.querySelector("#login-email").value;

      const password =
        document.querySelector("#login-password").value;

      const message =
        document.querySelector("#login-message");

      message.textContent = "Entrando...";

      try {

        await signIn(email, password);

        message.textContent =
          "Login realizado com sucesso.";

        render();

        setTimeout(
          () => show("meu-quadro"),
          300
        );

      } catch (error) {

        message.textContent =
          error.message;

      }
    };

  document.querySelector("#go-signup").onclick =
    () => show("cadastro");
}

/* =====================================================
   CADASTRO
===================================================== */

function renderSignup(el) {

  el.innerHTML = `

    <section class="auth-box">

      <h2>Criar minha conta</h2>

      <p class="muted">

        Utilize seu e-mail institucional
        <strong>@msm.org.br</strong>.

      </p>

      <label>

        Meu nome

        <select id="signup-name">

          <option value="">
            Selecione seu nome
          </option>

          ${members.map(m => `
            <option value="${m.name}">
              ${m.name}
            </option>
          `).join("")}

        </select>

      </label>

      <label>

        E-mail institucional

        <input
          id="signup-email"
          type="email"
          placeholder="seunome@msm.org.br"
          autocomplete="email"
        />

      </label>

      <label>

        Senha

        <input
          id="signup-password"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          autocomplete="new-password"
        />

      </label>

      <label>

        Confirmar senha

        <input
          id="signup-password-confirm"
          type="password"
          placeholder="Repita sua senha"
          autocomplete="new-password"
        />

      </label>

      <button
        class="primary"
        id="signup-button">

        Criar conta

      </button>

      <p id="signup-message"></p>

      <div class="auth-links">

        <button id="go-login">
          Já tenho uma conta
        </button>

      </div>

    </section>
  `;

  document.querySelector("#signup-button").onclick =
    async () => {

      const name =
        document.querySelector("#signup-name").value;

      const email =
        document.querySelector("#signup-email").value;

      const password =
        document.querySelector("#signup-password").value;

      const confirm =
        document.querySelector(
          "#signup-password-confirm"
        ).value;

      const message =
        document.querySelector("#signup-message");

      if (!name) {
        message.textContent =
          "Selecione seu nome.";
        return;
      }

      if (password !== confirm) {
        message.textContent =
          "As senhas não são iguais.";
        return;
      }

      message.textContent =
        "Criando sua conta...";

      try {

        await signUp(
          name,
          email,
          password
        );

        message.textContent =
          "Conta criada! Verifique seu e-mail institucional para confirmar o cadastro. Depois, aguarde a aprovação do administrador.";

      } catch (error) {

        message.textContent =
          error.message;

      }
    };

  document.querySelector("#go-login").onclick =
    () => show("login");
}

/* =====================================================
   MEU QUADRO
===================================================== */

function renderMyQuadro(el) {

  if (!currentUser) {
    show("login");
    return;
  }

  if (!currentMember) {

    el.innerHTML = `

      <section class="auth-box">

        <h2>Conta ainda não vinculada</h2>

        <p>
          Sua conta foi criada, mas ainda não
          encontramos o seu quadro.
        </p>

        <p class="muted">
          Entre em contato com o administrador
          do Preceptorado.
        </p>

      </section>
    `;

    return;
  }

  if (!currentMember.approved) {

    el.innerHTML = `

      <section class="auth-box">

        <h2>Cadastro aguardando aprovação</h2>

        <p>
          Sua conta foi criada corretamente.
        </p>

        <p class="muted">
          O administrador ainda precisa aprovar
          seu acesso ao quadro.
        </p>

        <p>
          Depois da aprovação, você poderá
          atualizar seus horários.
        </p>

      </section>
    `;

    return;
  }

  renderEditForm(el);
}

/* =====================================================
   FORMULÁRIO DO PRÓPRIO QUADRO
===================================================== */

function renderEditForm(el) {

  const selected = currentMember;

  el.innerHTML = `

    <h2>Meu Quadro</h2>

    <p class="muted">
      Bem-vindo, <strong>${selected.name}</strong>.
    </p>

    <label>

      Missa ferial

      <select id="missa">

        <option value="">
          Não informado
        </option>

        ${MASS_DAYS.map(x => `
          <option
            value="${x}"
            ${selected.missa_dia === x
              ? "selected"
              : ""}>
            ${x}
          </option>
        `).join("")}

      </select>

    </label>

    <div class="formgrid">

      ${DAYS.map(d => `

        <label>

          ${d[1]}

          <select id="${d[0]}">

            <option value="">
              Não informado
            </option>

            ${HOURS.map(h => `

              <option
                value="${h}"
                ${selected[d[0]] === h
                  ? "selected"
                  : ""}>

                ${h}

              </option>

            `).join("")}

          </select>

        </label>

      `).join("")}

    </div>

    <button
      class="primary"
      id="save">

      Salvar alterações

    </button>

    <p id="msg"></p>
  `;

  document.querySelector("#save").onclick =
    async () => {

      const button =
        document.querySelector("#save");

      const msg =
        document.querySelector("#msg");

      button.disabled = true;
      button.textContent = "Salvando...";

      const updated = {
        ...selected,

        missa_dia:
          document.querySelector("#missa").value ||
          null
      };

      DAYS.forEach(d => {

        updated[d[0]] =
     
