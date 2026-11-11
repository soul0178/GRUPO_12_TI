package edu.unsa.epcc.loans.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.dto.CreateItemRequest;
import edu.unsa.epcc.loans.inventory.dto.ItemResponse;
import edu.unsa.epcc.loans.inventory.dto.UpdateItemRequest;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestItemFactory;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;

/** Reglas de negocio del inventario (RF-03) contra PostgreSQL real. */
class ItemServiceTest extends IntegrationTestBase {

    @Autowired
    private ItemService itemService;
    @Autowired
    private TestItemFactory items;

    private String unique() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private CreateItemRequest createRequest(String code, Long categoryId) {
        return new CreateItemRequest(code, "Laptop Dell", "Equipo del laboratorio", categoryId);
    }

    private UpdateItemRequest updateRequest(Item item, ItemStatus status) {
        return new UpdateItemRequest(item.getCode(), item.getName(), item.getDescription(),
                item.getCategory().getId(), status);
    }

    @Test
    void shouldCreateItemAsAvailableWithUppercaseCode() {
        Long categoryId = items.category("Equipo").getId();

        ItemResponse created = itemService.create(createRequest("  eq-" + unique() + " ", categoryId));

        assertThat(created.status()).isEqualTo(ItemStatus.AVAILABLE);
        assertThat(created.code()).startsWith("EQ-").isEqualTo(created.code().toUpperCase());
        assertThat(created.category().name()).isEqualTo("Equipo");
    }

    @Test
    void shouldRejectItemWhenCodeAlreadyExists() {
        Item existing = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> itemService.create(createRequest(existing.getCode().toLowerCase(),
                existing.getCategory().getId())))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("código");
    }

    @Test
    void shouldRejectItemWhenCategoryDoesNotExist() {
        assertThatThrownBy(() -> itemService.create(createRequest("X-" + unique(), -1L)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldMarkItemOutOfServiceAndBackToAvailable() {
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);

        ItemResponse broken = itemService.update(item.getId(), updateRequest(item, ItemStatus.OUT_OF_SERVICE));
        ItemResponse repaired = itemService.update(item.getId(), updateRequest(item, ItemStatus.AVAILABLE));

        assertThat(broken.status()).isEqualTo(ItemStatus.OUT_OF_SERVICE);
        assertThat(repaired.status()).isEqualTo(ItemStatus.AVAILABLE);
    }

    @Test
    void shouldRejectManualChangeToOnLoanOrRetired() {
        Item item = items.create("Libro", ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> itemService.update(item.getId(), updateRequest(item, ItemStatus.ON_LOAN)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> itemService.update(item.getId(), updateRequest(item, ItemStatus.RETIRED)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldRejectStatusChangeWhenItemIsOnLoan() {
        Item item = items.create("Equipo", ItemStatus.ON_LOAN);

        assertThatThrownBy(() -> itemService.update(item.getId(), updateRequest(item, ItemStatus.OUT_OF_SERVICE)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("préstamo activo");
    }

    @Test
    void shouldAllowEditingNameOfItemOnLoanKeepingItsStatus() {
        Item item = items.create("Equipo", ItemStatus.ON_LOAN);
        UpdateItemRequest request = new UpdateItemRequest(item.getCode(), "Nombre nuevo", null,
                item.getCategory().getId(), ItemStatus.ON_LOAN);

        ItemResponse updated = itemService.update(item.getId(), request);

        assertThat(updated.name()).isEqualTo("Nombre nuevo");
        assertThat(updated.status()).isEqualTo(ItemStatus.ON_LOAN);
    }

    @Test
    void shouldRejectUpdateWhenCodeBelongsToAnotherItem() {
        Item first = items.create("Libro", ItemStatus.AVAILABLE);
        Item second = items.create("Libro", ItemStatus.AVAILABLE);
        UpdateItemRequest request = new UpdateItemRequest(first.getCode(), "X", null,
                second.getCategory().getId(), ItemStatus.AVAILABLE);

        assertThatThrownBy(() -> itemService.update(second.getId(), request)).isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldRetireAvailableItemKeepingIt() {
        Item item = items.create("Objeto", ItemStatus.AVAILABLE);

        ItemResponse retired = itemService.retire(item.getId());

        assertThat(retired.status()).isEqualTo(ItemStatus.RETIRED);
        assertThat(itemService.findById(item.getId()).code()).isEqualTo(item.getCode());
    }

    @Test
    void shouldRejectRetiringItemOnLoan() {
        Item item = items.create("Equipo", ItemStatus.ON_LOAN);

        assertThatThrownBy(() -> itemService.retire(item.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("préstamo activo");
    }

    @Test
    void shouldRejectRetiringAnAlreadyRetiredItem() {
        Item item = items.create("Objeto", ItemStatus.RETIRED);

        assertThatThrownBy(() -> itemService.retire(item.getId())).isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldRejectEditingARetiredItem() {
        Item item = items.create("Objeto", ItemStatus.RETIRED);

        assertThatThrownBy(() -> itemService.update(item.getId(), updateRequest(item, ItemStatus.AVAILABLE)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("dado de baja");
    }

    @Test
    void shouldFilterByTextCaseInsensitiveOverCodeAndName() {
        Item item = items.create("Libro", ItemStatus.AVAILABLE);

        PageResponse<ItemResponse> byCode = itemService.search(null, null,
                item.getCode().toLowerCase(), PageRequest.of(0, 10));

        assertThat(byCode.content()).extracting(ItemResponse::id).containsExactly(item.getId());
    }

    @Test
    void shouldFilterByCategoryAndStatus() {
        Item retiredBook = items.create("Libro", ItemStatus.RETIRED);
        items.create("Libro", ItemStatus.AVAILABLE);
        Long bookCategory = retiredBook.getCategory().getId();

        PageResponse<ItemResponse> page = itemService.search(bookCategory, ItemStatus.RETIRED, "",
                PageRequest.of(0, 100));

        assertThat(page.content()).extracting(ItemResponse::id).contains(retiredBook.getId());
        assertThat(page.content()).allSatisfy(item -> {
            assertThat(item.status()).isEqualTo(ItemStatus.RETIRED);
            assertThat(item.category().id()).isEqualTo(bookCategory);
        });
    }

    @Test
    void shouldFailWhenItemDoesNotExist() {
        assertThatThrownBy(() -> itemService.findById(-1L)).isInstanceOf(NotFoundException.class);
    }
}
