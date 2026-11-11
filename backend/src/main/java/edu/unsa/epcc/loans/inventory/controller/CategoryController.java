package edu.unsa.epcc.loans.inventory.controller;

import edu.unsa.epcc.loans.inventory.dto.CategoryResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateCategoryRequest;
import edu.unsa.epcc.loans.inventory.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Categorías de ítems: las consulta cualquier usuario y las edita solo un ADMIN (RF-03). */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /** Lista todas las categorías (son pocas, por eso no se pagina). */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<CategoryResponse> findAll() {
        return categoryService.findAll();
    }

    /** Edita el plazo máximo y la garantía de una categoría. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody UpdateCategoryRequest request) {
        return categoryService.update(id, request);
    }
}
