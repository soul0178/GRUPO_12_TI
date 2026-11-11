import { useState } from 'react';
import { CategoryRow } from '@/features/inventory/components/CategoryRow';
import type { CategoryFormValues } from '@/features/inventory/components/CategoryRow';
import { useCategories, useUpdateCategory } from '@/features/inventory/hooks/useCategories';
import type { Category } from '@/features/inventory/types/inventory';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';

/** Pantalla donde el ADMIN edita el plazo máximo de préstamo y la garantía de cada categoría (RF-03). */
export function CategoriesPage() {
  const categories = useCategories();
  const updateCategory = useUpdateCategory();
  const [savedName, setSavedName] = useState<string | null>(null);

  function handleSave(category: Category, values: CategoryFormValues) {
    setSavedName(null);
    updateCategory.mutate(
      { id: category.id, request: values },
      { onSuccess: () => setSavedName(category.name) },
    );
  }

  return (
    <section className="mx-auto max-w-4xl">
      <PageHeader
        title="Categorías"
        description="Plazo máximo de préstamo y requisito de garantía de cada categoría."
      />
      <div className="space-y-4">
        {categories.isLoading && <LoadingState message="Cargando categorías..." />}
        {categories.isError && <Alert variant="error">{getErrorMessage(categories.error)}</Alert>}
        {updateCategory.isError && (
          <Alert variant="error">{getErrorMessage(updateCategory.error)}</Alert>
        )}
        {savedName && <Alert variant="success">{`Categoría ${savedName} actualizada`}</Alert>}
        {categories.data && (
          <Card className="divide-y divide-slate-100">
            {categories.data.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                isSaving={updateCategory.isPending && updateCategory.variables?.id === category.id}
                onSave={(values) => handleSave(category, values)}
              />
            ))}
          </Card>
        )}
      </div>
    </section>
  );
}
