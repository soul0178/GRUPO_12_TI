package edu.unsa.epcc.loans.inventory.service;

import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.dto.CategoryResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateCategoryRequest;
import edu.unsa.epcc.loans.inventory.entity.Category;
import edu.unsa.epcc.loans.inventory.mapper.CategoryMapper;
import edu.unsa.epcc.loans.inventory.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Consulta y edición de las categorías y su política de préstamo (RF-03). */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    /** Lista todas las categorías ordenadas por nombre. */
    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(categoryMapper::toResponse).toList();
    }

    /** Actualiza el plazo máximo y la garantía de una categoría. Lanza NotFoundException si no existe. */
    @Transactional
    public CategoryResponse update(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la categoría con id " + id));
        categoryMapper.update(request, category);
        log.info("Categoría {} actualizada: plazo={}h, garantía={}", category.getName(), category.getMaxLoanHours(),
                category.isRequiresGuarantee());
        return categoryMapper.toResponse(category);
    }
}
