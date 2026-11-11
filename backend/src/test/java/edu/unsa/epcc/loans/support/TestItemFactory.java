package edu.unsa.epcc.loans.support;

import edu.unsa.epcc.loans.inventory.entity.Category;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.inventory.repository.CategoryRepository;
import edu.unsa.epcc.loans.inventory.repository.ItemRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Crea ítems de prueba con código único; las categorías son las sembradas por la migración. */
@Component
@RequiredArgsConstructor
public class TestItemFactory {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;

    /** Categoría sembrada por nombre ("Equipo", "Libro" u "Objeto"). */
    public Category category(String name) {
        return categoryRepository.findByName(name).orElseThrow();
    }

    /** Crea y guarda un ítem de la categoría y estado indicados. */
    public Item create(String categoryName, ItemStatus status) {
        Item item = new Item();
        item.setCode("T-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        item.setName("Ítem de prueba");
        item.setCategory(category(categoryName));
        item.setStatus(status);
        return itemRepository.save(item);
    }
}
