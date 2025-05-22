const form = document.getElementById('form');
const tabela = document.querySelector('#tabela tbody');
const metaStatus = document.getElementById('metaStatus');
const metaMensalStatus = document.getElementById('metaMensalStatus');
const calendario = document.getElementById('calendario');
const toast = document.getElementById('toast');
const busca = document.getElementById('busca');
let indiceEdicao = null;

let chartStatus, chartDiaria, chartMensal;

let meta = parseInt(localStorage.getItem('metaDiaria')) || 5;
let metaMensal = parseInt(localStorage.getItem('metaMensal')) || 100;

document.getElementById('metaDiaria').value = meta;
document.getElementById('metaMensal').value = metaMensal;

let candidaturas = JSON.parse(localStorage.getItem('candidaturas')) || [];

function getHoje() {
  return new Date().toISOString().split('T')[0];
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function salvarMeta() {
  meta = parseInt(document.getElementById('metaDiaria').value);
  metaMensal = parseInt(document.getElementById('metaMensal').value);
  localStorage.setItem('metaDiaria', meta);
  localStorage.setItem('metaMensal', metaMensal);
  atualizarTudo();
  showToast('Metas atualizadas!');
}

function alternarTema() {
  document.body.classList.toggle('dark');
}

function atualizarTabela() {
  tabela.innerHTML = "";
  const filtro = busca.value.toLowerCase();
  candidaturas.forEach((c, i) => {
    if (
      c.empresa.toLowerCase().includes(filtro) ||
      c.cargo.toLowerCase().includes(filtro)
    ) {
      const linha = `<tr>
        <td>${c.data}</td>
        <td>${c.empresa}</td>
        <td>${c.cargo}</td>
        <td><a href="${c.link}" target="_blank">Ver</a></td>
        <td>${c.plataforma}</td>
        <td>${c.status}</td>
        <td>${c.retorno}</td>
        <td>${c.observacoes}</td>
        <td>
          <button onclick="editar(${i})">✏️</button>
          <button onclick="excluir(${i})">❌</button>
        </td>
      </tr>`;
      tabela.innerHTML += linha;
    }
  });
}

function atualizarMeta() {
  const hoje = getHoje();
  const hojeCount = candidaturas.filter(c => c.data === hoje).length;
  metaStatus.textContent = `Hoje: ${hojeCount}/${meta} candidaturas.`;
  metaStatus.style.color = hojeCount >= meta ? "green" : "red";

  const mesAtual = hoje.slice(0, 7);
  const mesCount = candidaturas.filter(c => c.data.startsWith(mesAtual)).length;
  metaMensalStatus.textContent = `Mês: ${mesCount}/${metaMensal} candidaturas.`;
  metaMensalStatus.style.color = mesCount >= metaMensal ? "green" : "red";
}

function atualizarCalendario() {
  calendario.innerHTML = "";
  const dias = {};
  candidaturas.forEach(c => {
    dias[c.data] = (dias[c.data] || 0) + 1;
  });

  Object.keys(dias).forEach(data => {
    const div = document.createElement('div');
    div.className = 'dia ' + (dias[data] >= meta ? 'ok' : 'fail');
    div.textContent = `${data}\n${dias[data]} envios`;
    calendario.appendChild(div);
  });
}

function atualizarGraficoStatus() {
  if (chartStatus) chartStatus.destroy();

  const contagem = {};
  candidaturas.forEach(c => {
    contagem[c.status] = (contagem[c.status] || 0) + 1;
  });

  const ctx = document.getElementById('graficoStatus').getContext('2d');
  chartStatus = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(contagem),
      datasets: [{
        data: Object.values(contagem),
        backgroundColor: ['#0077cc', '#ffcc00', '#00cc66', '#cc3300', '#999999']
      }]
    }
  });
}

function atualizarGraficoMetaDiaria() {
  if (chartDiaria) chartDiaria.destroy();

  const dias = {};
  candidaturas.forEach(c => {
    dias[c.data] = (dias[c.data] || 0) + 1;
  });

  const labels = Object.keys(dias).sort();
  const data = labels.map(d => dias[d]);

  const ctx = document.getElementById('graficoMetaDiaria').getContext('2d');
  chartDiaria = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Candidaturas por Dia',
        data: data,
        backgroundColor: '#0077cc'
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function atualizarGraficoMetaMensal() {
  if (chartMensal) chartMensal.destroy();

  const meses = {};
  candidaturas.forEach(c => {
    const mes = c.data.slice(0, 7);
    meses[mes] = (meses[mes] || 0) + 1;
  });

  const labels = Object.keys(meses).sort();
  const data = labels.map(m => meses[m]);

  const ctx = document.getElementById('graficoMetaMensal').getContext('2d');
  chartMensal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Candidaturas por Mês',
        data: data,
        backgroundColor: '#00cc66'
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function editar(index) {
  const c = candidaturas[index];
  form.empresa.value = c.empresa;
  form.cargo.value = c.cargo;
  form.link.value = c.link;
  form.plataforma.value = c.plataforma;
  form.status.value = c.status;
  form.retorno.value = c.retorno;
  form.observacoes.value = c.observacoes;
  indiceEdicao = index;
  showToast('Modo edição ativado');
}

function excluir(index) {
  candidaturas.splice(index, 1);
  localStorage.setItem('candidaturas', JSON.stringify(candidaturas));
  atualizarTudo();
  showToast('Registro excluído');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const hoje = getHoje();
  const nova = {
    data: hoje,
    empresa: form.empresa.value,
    cargo: form.cargo.value,
    link: form.link.value,
    plataforma: form.plataforma.value,
    status: form.status.value,
    retorno: form.retorno.value,
    observacoes: form.observacoes.value
  };

  if (indiceEdicao !== null) {
    candidaturas[indiceEdicao] = nova;
    indiceEdicao = null;
    showToast('Candidatura atualizada!');
  } else {
    candidaturas.push(nova);
    showToast('Candidatura salva!');
  }

  localStorage.setItem('candidaturas', JSON.stringify(candidaturas));
  atualizarTudo();
  form.reset();
});

busca.addEventListener('input', atualizarTabela);

function atualizarTudo() {
  atualizarTabela();
  atualizarMeta();
  atualizarCalendario();
  atualizarGraficoStatus();
  atualizarGraficoMetaDiaria();
  atualizarGraficoMetaMensal();
}

document.addEventListener('DOMContentLoaded', atualizarTudo);
