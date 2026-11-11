package edu.unsa.epcc.loans.inventory.mapper;

import edu.unsa.epcc.loans.inventory.dto.CreateItemRequest;
import edu.unsa.epcc.loans.inventory.dto.ItemResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateItemRequest;
import edu.unsa.epcc.loans.inventory.entity.Item;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/** Convierte entre la entidad Item y sus DTOs; la categoría y el estado los asigna el servicio. */
@Mapper(componentModel = "spring", uses = CategoryMapper.class)
public interface ItemMapper {

    ItemResponse toResponse(Item item);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "status", ignore = true)
    Item toEntity(CreateItemRequest request);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "status", ignore = true)
    void update(UpdateItemRequest request, @MappingTarget Item item);
}
