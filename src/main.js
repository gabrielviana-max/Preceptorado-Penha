import { createClient } from "@supabase/supabase-js";
import "./style.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY
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
["Kelvin de Almeida Soares","Sábado","Ofício das Leituras","Laudes","Terça","Sexta","Nona","Ofício das Leituras"],
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
  JSON.parse(localStorage.getItem("penha_members") || "null") ||
  seed;

let currentUser = null;

function saveLocal() {
  localStorage.setItem(
    "penha_members",
    JSON.stringify(members)
  );
}

async function load() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("active", true)
    .order("name");

  if (!error && data?.length) {
    members = data;
    saveLocal();
  }
}

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

      <button data-view="atualizar">
        Atualizar meu quadro
      </button>

      <button data-view="login">
        Entrar
      </button>

    </nav>

    <main id="content"></main>

    <footer>
      Militia Sanctæ Mariæ ·
      Atualização automática dos totais
    </footer>
  `;

  document
    .querySelectorAll("nav button")
    .forEach(button => {

      button.onclick = () => {
        show(button.dataset.view);
      };

    });

  show("geral");
}

function show(view) {

  document
    .querySelectorAll("nav button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view === view
      );

    });

  const el =
    document.querySelector("#content");

  if (view === "geral") {
    showGeneral(el);
    return;
  }

  if (view === "irmãos") {
    showMembers(el);
    return;
  }

  if (view === "login") {
    showLogin(el);
    return;
  }

  showUpdate(el);
}

function showGeneral(el) {

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
              .reduce((a,b) => a + b, 0)}
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

function showMembers(el) {

  el.innerHTML = `

    <h2>Irmãos</h2>

    <div class="people">

      ${members.map(m => `

        <article>

          <b>${m.name}</b>

          <span>
            Missa: ${m.missa_dia || "—"}
          </span>

          <button data-name="${m.name}">
            Ver quadro
          </button>

        </article>

      `).join("")}

    </div>
  `;

  el
    .querySelectorAll(".people button")
    .forEach(button => {

      button.onclick = () => {

        edit(button.dataset.name);

      };

    });
}

function showLogin(el) {

  el.innerHTML = `

    <section class="authbox">

      <h2>Área dos Irmãos</h2>

      <p class="muted">
        Entre com seu e-mail institucional
        <strong>@msm.org.br</strong>.
      </p>

      <label>
        E-mail

        <input
          id="login-email"
          type="email"
          placeholder="seunome@msm.org.br"
        >
      </label>

      <label>
        Senha

        <input
          id="login-password"
          type="password"
          placeholder="Sua senha"
        >
      </label>

      <button
        class="primary"
        id="login-button">

        Entrar

      </button>

      <p id="login-message"></p>

      <p class="muted">
        Ainda não possui uma conta?
      </p>

      <button id="signup-button">
        Criar minha conta
      </button>

      <br><br>

      <button id="forgot-button">
        Esqueci minha senha
      </button>

    </section>
  `;

  document
    .querySelector("#login-button")
    .onclick = login;

  document
    .querySelector("#signup-button")
    .onclick = signup;

  document
    .querySelector("#forgot-button")
    .onclick = resetPassword;
}

async function login() {

  const email =
    document
      .querySelector("#login-email")
      .value
      .trim()
      .toLowerCase();

  const password =
    document
      .querySelector("#login-password")
      .value;

  const message =
    document.querySelector("#login-message");

  if (!email.endsWith("@msm.org.br")) {

    message.textContent =
      "Utilize seu e-mail institucional @msm.org.br.";

    return;
  }

  if (!password) {

    message.textContent =
      "Informe sua senha.";

    return;
  }

  if (!supabase) {

    message.textContent =
      "Supabase não configurado.";

    return;
  }

  message.textContent =
    "Entrando...";

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    message.textContent =
      "Não foi possível entrar. Verifique seu e-mail e senha.";

    return;
  }

  currentUser = data.user;

  message.textContent =
    "Login realizado com sucesso.";

  setTimeout(() => {

    show("geral");

  }, 500);
}

async function signup() {

  const email =
    document
      .querySelector("#login-email")
      .value
      .trim()
      .toLowerCase();

  const password =
    document
      .querySelector("#login-password")
      .value;

  const message =
    document.querySelector("#login-message");

  if (!email.endsWith("@msm.org.br")) {
    message.textContent =
      "O cadastro é permitido somente com e-mail @msm.org.br.";
    return;
  }

  if (!password || password.length < 6) {
    message.textContent =
      "A senha deve possuir pelo menos 6 caracteres.";
    return;
  }

  const passwordConfirm = prompt(
    "Digite novamente sua senha:"
  );

  if (password !== passwordConfirm) {
    message.textContent =
      "As senhas não são iguais.";
    return;
  }

  const name = prompt(
    "Digite seu nome exatamente como aparece no Quadro:"
  );

  if (!name) {
    message.textContent =
      "O nome é necessário para criar a conta.";
    return;
  }

  const member = members.find(
    m =>
      m.name.trim().toLowerCase() ===
      name.trim().toLowerCase()
  );

  if (!member) {
    message.textContent =
      "Nome não encontrado no Quadro. Verifique a grafia.";
    return;
  }

  if (!supabase) {
    message.textContent =
      "Supabase não configurado.";
    return;
  }

  message.textContent =
    "Criando sua conta...";

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          window.location.origin,

        data: {
          full_name: member.name
        }
      }
    });

  if (error) {
    message.textContent =
      error.message;
    return;
  }

  if (data.session) {

    currentUser = data.user;

    message.textContent =
      "Conta criada com sucesso.";

  } else {

    message.textContent =
      "Conta criada. Verifique seu e-mail @msm.org.br para confirmar o cadastro.";
  }
}
async function resetPassword() {

  const email =
    document
      .querySelector("#login-email")
      .value
      .trim()
      .toLowerCase();

  const message =
    document.querySelector("#login-message");

  if (!email.endsWith("@msm.org.br")) {

    message.textContent =
      "Informe seu e-mail @msm.org.br.";

    return;
  }

  if (!supabase) {

    message.textContent =
      "Supabase não configurado.";

    return;
  }

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin
      }
    );

  if (error) {

    message.textContent =
      error.message;

    return;
  }

  message.textContent =
    "Enviamos as instruções para seu e-mail.";
}

function showUpdate(el) {

  if (!currentUser) {

    el.innerHTML = `

      <section class="authbox">

        <h2>Acesso restrito</h2>

        <p>
          Para atualizar seu quadro,
          primeiro entre em sua conta.
        </p>

        <button
          class="primary"
          id="go-login">

          Entrar

        </button>

      </section>
    `;

    document
      .querySelector("#go-login")
      .onclick = () => show("login");

    return;
  }

  el.innerHTML = `

    <h2>Atualizar meu quadro</h2>

    <p class="muted">
      Você está conectado como:
      <strong>${currentUser.email}</strong>
    </p>

    <select id="person">

      <option value="">
        Selecione seu nome
      </option>

      ${members.map(m => `
        <option value="${m.name}">
          ${m.name}
        </option>
      `).join("")}

    </select>

    <div id="form"></div>
  `;

  document
    .querySelector("#person")
    .onchange = event => {

      edit(event.target.value);

    };
}

function edit(name) {

  selected =
    members.find(
      m => m.name === name
    );

  if (!selected) return;

  const el =
    document.querySelector("#content");

  el.innerHTML = `

    <h2>
      Atualizar quadro — ${selected.name}
    </h2>

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

  document
    .querySelector("#save")
    .onclick = async () => {

      const msg =
        document.querySelector("#msg");

      const updated = {
        ...selected,

        missa_dia:
          document
            .querySelector("#missa")
            .value || null
      };

      DAYS.forEach(d => {

        updated[d[0]] =
          document
            .querySelector("#" + d[0])
            .value || null;

      });

      const index =
        members.findIndex(
          m => m.name === selected.name
        );

      members[index] = updated;

      try {

        if (supabase && currentUser) {

          const { error } =
            await supabase
              .from("members")
              .upsert(updated, {
                onConflict: "name"
              });

          if (error) {
            throw error;
          }
        }

        saveLocal();

        msg.textContent =
          "Quadro atualizado com sucesso.";

      } catch (error) {

        msg.textContent =
          "Erro ao salvar: " +
          error.message;
      }
    };
}

async function init() {

  await load();

  if (supabase) {

    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();

    currentUser =
      session?.user || null;

    supabase.auth.onAuthStateChange(
      (_event, session) => {

        currentUser =
          session?.user || null;

      }
    );
  }

  render();
}

init();
