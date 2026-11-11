package edu.unsa.epcc.loans.inventory.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.dto.CreateItemRequest;
import edu.unsa.epcc.loans.inventory.dto.ItemResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateItemRequest;
import edu.unsa.epcc.loans.inventory.entity.Category;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.inventory.mapper.ItemMapper;
import edu.unsa.epcc.loans.inventory.repository.CategoryRepository;
import edu.unsa.epcc.loans.inventory.repository.ItemRepository;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import edu.unsa.epcc.loans.reservation.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestiona el inventario de ítems: consulta, alta, edición y baja (RF-03). */
@Slf4j
@Service
@RequiredArgsConstructor
public class ItemService {

    /** Estados que el personal puede asignar a mano; ON_LOAN lo fija el préstamo y RETIRED solo la baja. */
    private static final Set<ItemStatus> MANUAL_STATUSES = EnumSet.of(ItemStatus.AVAILABLE, ItemStatus.OUT_OF_SERVICE);

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final ItemMapper itemMapper;
    private final ReservationService reservationService;

    /** Busca ítems paginados con filtros opcionales de categoría, estado y texto (código o nombre). */
    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> search(Long categoryId, ItemStatus status, String text, Pageable pageable) {
        String pattern = "%" + (text == null ? "" : text.trim().toLowerCase(Locale.ROOT)) + "%";
        return PageResponse.from(itemRepository.search(categoryId, status, pattern, pageable)
                .map(itemMapper::toResponse));
    }

    /** Devuelve un ítem por id. Lanza NotFoundException si no existe. */
    @Transactional(readOnly = true)
    public ItemResponse findById(Long id) {
        return itemMapper.toResponse(getItem(id));
    }

    /** Da de alta un ítem como AVAILABLE. Lanza BusinessException si el código ya existe. */
    @Transactional
    public ItemResponse create(CreateItemRequest request) {
        String code = normalizeCode(request.code());
        if (itemRepository.existsByCode(code)) {
            throw new BusinessException("Ya existe un ítem con el código " + code);
        }
        Item item = itemMapper.toEntity(request);
        item.setCode(code);
        item.setCategory(getCategory(request.categoryId()));
        item.setStatus(ItemStatus.AVAILABLE);
        Item saved = itemRepository.save(item);
        log.info("Ítem creado: código={}", saved.getCode());
        return itemMapper.toResponse(saved);
    }

    /**
     * Modifica un ítem. Lanza BusinessException si está dado de baja, si el código es de otro ítem
     * o si el cambio de estado no está permitido (solo AVAILABLE y OUT_OF_SERVICE, y nunca con el ítem prestado).
     */
    @Transactional
    public ItemResponse update(Long id, UpdateItemRequest request) {
        Item item = getItem(id);
        if (item.getStatus() == ItemStatus.RETIRED) {
            throw new BusinessException("No se puede modificar un ítem dado de baja");
        }
        String code = normalizeCode(request.code());
        if (itemRepository.existsByCodeAndIdNot(code, id)) {
            throw new BusinessException("Ya existe un ítem con el código " + code);
        }
        validateStatusChange(item.getStatus(), request.status());
        itemMapper.update(request, item);
        item.setCode(code);
        item.setCategory(getCategory(request.categoryId()));
        item.setStatus(request.status());
        return itemMapper.toResponse(item);
    }

    /**
     * Da de baja un ítem (pasa a RETIRED, nunca se borra). Lanza BusinessException si ya está dado de baja o
     * tiene un préstamo activo (está ON_LOAN). o reservas pendientes.
     */
    @Transactional
    public ItemResponse retire(Long id) {
        // Antes de cargar el ítem: la consulta de reservas hace una actualización masiva que desvincula entidades.
        boolean hasPendingReservations = reservationService.hasPendingReservations(id);
        Item item = getItem(id);
        if (item.getStatus() == ItemStatus.RETIRED) {
            throw new BusinessException("El ítem ya está dado de baja");
        }
        if (item.getStatus() == ItemStatus.ON_LOAN) {
            throw new BusinessException("No se puede dar de baja un ítem con préstamo activo");
        }
        if (hasPendingReservations) {
            throw new BusinessException("No se puede dar de baja un ítem con reservas pendientes");
        }
        item.setStatus(ItemStatus.RETIRED);
        log.info("Ítem dado de baja: código={}", item.getCode());
        return itemMapper.toResponse(item);
    }

    /**
     * Marca un ítem como prestado (ON_LOAN) al entregarlo y devuelve sus datos, incluida la categoría.
     * Lanza BusinessException si el ítem no está AVAILABLE. Lo usa el módulo de préstamos.
     */
    @Transactional
    public ItemResponse markAsLoaned(Long id) {
        Item item = getItem(id);
        if (item.getStatus() != ItemStatus.AVAILABLE) {
            throw new BusinessException("El ítem " + item.getCode() + " no está disponible (estado: "
                    + item.getStatus().getLabel() + ")");
        }
        item.setStatus(ItemStatus.ON_LOAN);
        return itemMapper.toResponse(item);
    }

    /** Devuelve el ítem al inventario al recibirlo: queda AVAILABLE, o OUT_OF_SERVICE si volvió dañado. */
    @Transactional
    public void markAsReturned(Long id, boolean damaged) {
        Item item = getItem(id);
        item.setStatus(damaged ? ItemStatus.OUT_OF_SERVICE : ItemStatus.AVAILABLE);
    }

    private void validateStatusChange(ItemStatus current, ItemStatus requested) {
        if (current == requested) {
            return;
        }
        if (current == ItemStatus.ON_LOAN) {
            throw new BusinessException("No se puede cambiar el estado de un ítem con préstamo activo");
        }
        if (!MANUAL_STATUSES.contains(requested)) {
            throw new BusinessException("El estado solo puede cambiarse a Disponible o Fuera de servicio");
        }
    }

    private Item getItem(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el ítem con id " + id));
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la categoría con id " + id));
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }
}
