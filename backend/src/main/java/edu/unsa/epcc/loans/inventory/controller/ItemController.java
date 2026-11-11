package edu.unsa.epcc.loans.inventory.controller;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.inventory.dto.CreateItemRequest;
import edu.unsa.epcc.loans.inventory.dto.ItemResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateItemRequest;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.inventory.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Catálogo de ítems: lo consulta cualquier usuario y lo gestiona el personal (MANAGER y ADMIN) (RF-03). */
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private static final String STAFF = "hasAnyRole('MANAGER', 'ADMIN')";

    private final ItemService itemService;

    /** Lista ítems paginados, con filtros opcionales por categoría, estado y texto. */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public PageResponse<ItemResponse> search(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) String text,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        return itemService.search(categoryId, status, text, pageable);
    }

    /** Devuelve un ítem por id. */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ItemResponse findById(@PathVariable Long id) {
        return itemService.findById(id);
    }

    /** Da de alta un ítem. */
    @PostMapping
    @PreAuthorize(STAFF)
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@Valid @RequestBody CreateItemRequest request) {
        return itemService.create(request);
    }

    /** Modifica un ítem. */
    @PutMapping("/{id}")
    @PreAuthorize(STAFF)
    public ItemResponse update(@PathVariable Long id, @Valid @RequestBody UpdateItemRequest request) {
        return itemService.update(id, request);
    }

    /** Da de baja un ítem. */
    @PostMapping("/{id}/retire")
    @PreAuthorize(STAFF)
    public ItemResponse retire(@PathVariable Long id) {
        return itemService.retire(id);
    }
}
