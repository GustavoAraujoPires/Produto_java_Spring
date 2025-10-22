package com.produto.cadastro.Controller;

import com.produto.cadastro.Produtos.Produto;
import com.produto.cadastro.Service.ProdutoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoService Service;

    public ProdutoController(ProdutoService service) {
        Service = service;
    }

    @GetMapping
    public List<Produto> carregaProduto(){
        return Service.ListaDeProduto();
    }

    @PostMapping
    public Produto salvarNovoProduto(@RequestBody Produto produto){
        return Service.cadastarProduto(produto);
    }

    @GetMapping("/{id}")
    public Produto buscarProdutoid(@PathVariable Long id){
        return Service.BuscarProdutoId(id);
    }


    @DeleteMapping("/{id}")
    public void deletarProdutos(@PathVariable Long id) {
        Service.excluirProduto(id);
    }

    @PostMapping("/{id}")
    public Produto atualizarProdutos(@PathVariable Long id, @RequestBody Produto produtosAlterado){
        Produto produtoExistente = Service.BuscarProdutoId(id);

        if(produtoExistente == null) return null;

        produtoExistente.setName(produtosAlterado.getName());
        produtoExistente.setDescricao(produtosAlterado.getDescricao());
        produtoExistente.setPreco(produtosAlterado.getPreco());

        return Service.cadastarProduto(produtosAlterado);

    }

}
