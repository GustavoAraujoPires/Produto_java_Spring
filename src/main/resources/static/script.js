// ===== CONFIG =====
// ajuste se necessário (ex: "http://localhost:8080/api")
const API_BASE = "http://localhost:8080";


// se você não tiver backend rodando, defina true para testar UI com localStorage
const USE_MOCK = false;

// ===== estado local =====
let editingProductId = null;

// ===== utilitários =====
function showError(msg) {
  console.error(msg);
  alert(msg);
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(()=>"");
      throw new Error(`HTTP ${res.status} - ${res.statusText}\n${text}`);
    }
    // pode ser 204 No Content
    if (res.status === 204) return null;
    const json = await res.json().catch(()=>null);
    return json;
  } catch (err) {
    throw err;
  }
}

// ===== MOCK (fallback para testar sem backend) =====
if (USE_MOCK) {
  // inicializa alguns dados se ainda não tiver
  if (!localStorage.getItem("mock_categorias")) {
    const cats = [
      { id: 1, nome: "Bebidas" },
      { id: 2, nome: "Alimentos" }
    ];
    localStorage.setItem("mock_categorias", JSON.stringify(cats));
  }
  if (!localStorage.getItem("mock_produtos")) {
    const prods = [
      { id: 1, nome: "Refrigerante", preco: 5.5, categoriaId: 1 },
      { id: 2, nome: "Arroz", preco: 12.0, categoriaId: 2 }
    ];
    localStorage.setItem("mock_produtos", JSON.stringify(prods));
  }
}

// ===== Categorias =====
async function carregarCategorias() {
  try {
    let categorias;
    if (USE_MOCK) {
      categorias = JSON.parse(localStorage.getItem("mock_categorias") || "[]");
    } else {
      categorias = await safeFetch(`${API_BASE}/categorias`);
    }

    const lista = document.getElementById("listaCategorias");
    const select = document.getElementById("categoriaProduto");

    lista.innerHTML = "";
    // deixa a opção padrão
    select.innerHTML = '<option value="">-- selecione uma categoria --</option>';

    categorias.forEach(cat => {
      const li = document.createElement("li");
      li.textContent = cat.nome;

      const btn = document.createElement("button");
      btn.textContent = "Excluir";
      btn.onclick = async () => {
        if (!confirm(`Excluir categoria "${cat.nome}"?`)) return;
        await excluirCategoria(cat.id);
      };

      li.appendChild(btn);
      lista.appendChild(li);

      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.nome;
      select.appendChild(opt);
    });
  } catch (err) {
    showError("Erro ao carregar categorias. Veja o console.");
    console.error(err);
  }
}

async function criarCategoria() {
  const nome = document.getElementById("nomeCategoria").value.trim();
  if (!nome) return alert("Informe o nome da categoria.");

  try {
    if (USE_MOCK) {
      const cats = JSON.parse(localStorage.getItem("mock_categorias") || "[]");
      const id = cats.length ? Math.max(...cats.map(c=>c.id))+1 : 1;
      cats.push({ id, nome });
      localStorage.setItem("mock_categorias", JSON.stringify(cats));
    } else {
      await safeFetch(`${API_BASE}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome })
      });
    }
    document.getElementById("nomeCategoria").value = "";
    await carregarCategorias();
    await carregarProdutos(); // atualizar nomes de categoria na tabela
  } catch (err) {
    showError("Erro ao criar categoria. Veja o console.");
    console.error(err);
  }
}

async function excluirCategoria(id) {
  try {
    if (USE_MOCK) {
      let cats = JSON.parse(localStorage.getItem("mock_categorias") || "[]");
      cats = cats.filter(c => c.id !== id);
      localStorage.setItem("mock_categorias", JSON.stringify(cats));
      // também remover categoria dos produtos (ouset categoriaId para null)
      let prods = JSON.parse(localStorage.getItem("mock_produtos") || "[]");
      prods = prods.map(p => p.categoriaId === id ? { ...p, categoriaId: null } : p);
      localStorage.setItem("mock_produtos", JSON.stringify(prods));
    } else {
      await safeFetch(`${API_BASE}/categorias/${id}`, { method: "DELETE" });
    }
    await carregarCategorias();
    await carregarProdutos();
  } catch (err) {
    showError("Erro ao excluir categoria. Veja o console.");
    console.error(err);
  }
}

// ===== Produtos =====
async function carregarProdutos() {
  try {
    let produtos;
    if (USE_MOCK) {
      produtos = JSON.parse(localStorage.getItem("mock_produtos") || "[]");
    } else {
      produtos = await safeFetch(`${API_BASE}/produtos`);
    }

    // pega categorias para exibir nome
    const categorias = USE_MOCK
      ? JSON.parse(localStorage.getItem("mock_categorias") || "[]")
      : await safeFetch(`${API_BASE}/categorias`);

    const tabela = document.getElementById("tabelaProdutos");
    tabela.innerHTML = "";

    produtos.forEach(prod => {
      const tr = document.createElement("tr");
      const categoria = categorias ? categorias.find(c => c.id === prod.categoriaId) : null;
      const precoText = (typeof prod.preco === 'number') ? prod.preco.toFixed(2) : prod.preco;

      tr.innerHTML = `
        <td>${prod.nome}</td>
        <td>R$ ${precoText}</td>
        <td>${categoria ? categoria.nome : "-"}</td>
        <td class="actions"></td>
      `;

      const actionsTd = tr.querySelector(".actions");

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Editar";
      btnEdit.onclick = () => iniciarEdicaoProduto(prod);

      const btnDel = document.createElement("button");
      btnDel.textContent = "Excluir";
      btnDel.className = "delete";
      btnDel.onclick = async () => {
        if (!confirm(`Excluir produto "${prod.nome}"?`)) return;
        await excluirProduto(prod.id);
      };

      actionsTd.appendChild(btnEdit);
      actionsTd.appendChild(btnDel);

      tabela.appendChild(tr);
    });

    // aplicar filtro de busca se houver texto
    aplicarFiltroBusca();
  } catch (err) {
    showError("Erro ao carregar produtos. Veja o console.");
    console.error(err);
  }
}

async function criarOuSalvarProduto() {
  const nome = document.getElementById("nomeProduto").value.trim();
  const precoVal = document.getElementById("precoProduto").value;
  const preco = parseFloat(precoVal);
  const categoriaIdVal = document.getElementById("categoriaProduto").value;
  const categoriaId = categoriaIdVal ? parseInt(categoriaIdVal) : null;

  if (!nome || isNaN(preco) || !categoriaId) {
    return alert("Preencha nome, preço e categoria corretamente.");
  }

  try {
    if (editingProductId) {
      // salvar (PUT)
      if (USE_MOCK) {
        let prods = JSON.parse(localStorage.getItem("mock_produtos") || "[]");
        prods = prods.map(p => p.id === editingProductId ? { id: p.id, nome, preco, categoriaId } : p);
        localStorage.setItem("mock_produtos", JSON.stringify(prods));
      } else {
        await safeFetch(`${API_BASE}/produtos/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, preco, categoriaId })
        });
      }

      editingProductId = null;
      document.getElementById("btnCriarProduto").textContent = "Adicionar";
    } else {
      // criar (POST)
      if (USE_MOCK) {
        const prods = JSON.parse(localStorage.getItem("mock_produtos") || "[]");
        const id = prods.length ? Math.max(...prods.map(p=>p.id))+1 : 1;
        prods.push({ id, nome, preco, categoriaId });
        localStorage.setItem("mock_produtos", JSON.stringify(prods));
      } else {
        await safeFetch(`${API_BASE}/produtos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, preco, categoriaId })
        });
      }
    }

    // limpar formulário e recarregar
    document.getElementById("nomeProduto").value = "";
    document.getElementById("precoProduto").value = "";
    document.getElementById("categoriaProduto").value = "";

    await carregarProdutos();
  } catch (err) {
    showError("Erro ao salvar produto. Veja o console.");
    console.error(err);
  }
}

function iniciarEdicaoProduto(prod) {
  editingProductId = prod.id;
  document.getElementById("nomeProduto").value = prod.nome;
  document.getElementById("precoProduto").value = prod.preco;
  document.getElementById("categoriaProduto").value = prod.categoriaId || "";

  document.getElementById("btnCriarProduto").textContent = "Salvar";
}

async function excluirProduto(id) {
  try {
    if (USE_MOCK) {
      let prods = JSON.parse(localStorage.getItem("mock_produtos") || "[]");
      prods = prods.filter(p => p.id !== id);
      localStorage.setItem("mock_produtos", JSON.stringify(prods));
    } else {
      await safeFetch(`${API_BASE}/produtos/${id}`, { method: "DELETE" });
    }
    await carregarProdutos();
  } catch (err) {
    showError("Erro ao excluir produto. Veja o console.");
    console.error(err);
  }
}

// ===== busca =====
function aplicarFiltroBusca() {
  const termo = document.getElementById("buscaProduto").value.trim().toLowerCase();
  const linhas = document.querySelectorAll("#tabelaProdutos tr");
  linhas.forEach(tr => {
    const nome = tr.children[0]?.textContent?.toLowerCase() || "";
    tr.style.display = nome.includes(termo) ? "" : "none";
  });
}

// ===== inicialização e listeners =====
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnCriarCategoria").addEventListener("click", criarCategoria);
  document.getElementById("btnAtualizarCategorias").addEventListener("click", carregarCategorias);

  document.getElementById("btnCriarProduto").addEventListener("click", criarOuSalvarProduto);
  document.getElementById("btnAtualizarProdutos").addEventListener("click", carregarProdutos);

  document.getElementById("buscaProduto").addEventListener("input", aplicarFiltroBusca);

  // carregar dados iniciais
  carregarCategorias();
  carregarProdutos();

  console.log("UI inicializada. USE_MOCK =", USE_MOCK);
  if (!USE_MOCK) console.log("API_BASE =", API_BASE);
}

);
