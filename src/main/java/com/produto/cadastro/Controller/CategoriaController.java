package com.produto.cadastro.Controller;

import com.produto.cadastro.Produtos.Categoria;
import com.produto.cadastro.Service.CategoriaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    public List<Categoria> listaCategoria(){
        return categoriaService.listaCategoria();
    }

    @PostMapping
    public Categoria salvarCategoria(@RequestBody Categoria categoria){
        return categoriaService.cadastrarCategoria(categoria);
    }

    @GetMapping("/{id}")
    public Categoria buscarPorId(@PathVariable Long id){
        return categoriaService.buscarCategoria(id);
    }

    @DeleteMapping("/{id}")
    public void deletarPorId(@PathVariable Long id){
        categoriaService.excluirCategoria(id);
    }

    @PutMapping("/{id}")
    public Categoria atualizarCategoria(@PathVariable Long id, @RequestBody Categoria categoriaAtualizado ){
         Categoria categoriaExistente = categoriaService.buscarCategoria(id);
         if(categoriaExistente == null) return null;

         categoriaExistente.setNome(categoriaAtualizado.getNome());

         return categoriaService.cadastrarCategoria(categoriaAtualizado);
    }


}
