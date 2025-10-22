package com.produto.cadastro.Service;

import com.produto.cadastro.Interface.CategoriaRepository;
import com.produto.cadastro.Produtos.Categoria;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public List<Categoria> listaCategoria(){
        return categoriaRepository.findAll();
    }

    public Categoria cadastrarCategoria(Categoria categoria){
        return categoriaRepository.save(categoria);
    }

    public void excluirCategoria(Long id){
        categoriaRepository.deleteById(id);
    }
     public Categoria buscarCategoria(Long id){
        return categoriaRepository.findById(id).orElse(null);
     }

}
