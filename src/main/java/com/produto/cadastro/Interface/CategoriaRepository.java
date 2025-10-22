package com.produto.cadastro.Interface;

import com.produto.cadastro.Produtos.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria,Long> {
}
