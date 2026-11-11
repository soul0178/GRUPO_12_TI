package edu.unsa.epcc.loans.inventory.mapper;

import edu.unsa.epcc.loans.inventory.dto.CategoryResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateCategoryRequest;
import edu.unsa.epcc.loans.inventory.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

/** Convierte entre la entidad Category y sus DTOs. */
@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryResponse toResponse(Category category);

    void update(UpdateCategoryRequest request, @MappingTarget Category category);
}
