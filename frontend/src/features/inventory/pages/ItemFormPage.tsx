import { Link, useNavigate, useParams } from 'react-router-dom';
import { ItemForm } from '@/features/inventory/components/ItemForm';
import type { ItemFormValues } from '@/features/inventory/components/ItemForm';
import { useCategories } from '@/features/inventory/hooks/useCategories';
import { useCreateItem, useUpdateItem } from '@/features/inventory/hooks/useItemMutations';
import { useItem } from '@/features/inventory/hooks/useItems';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

/** Pantalla de alta (`/items/new`) y edición (`/items/:id/edit`) de un ítem (personal, RF-03). */
export function ItemFormPage() {
  const { id } = useParams();
  const itemId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const categories = useCategories();
  const existing = useItem(itemId);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem(itemId ?? 0);
  const mutation = itemId === undefined ? createItem : updateItem;

  if (categories.isLoading || (itemId !== undefined && existing.isLoading)) {
    return <LoadingState message="Cargando datos..." />;
  }
  if (categories.isError || !categories.data) {
    return <Alert variant="error">{getErrorMessage(categories.error)}</Alert>;
  }
  if (itemId !== undefined && (existing.isError || !existing.data)) {
    return <Alert variant="error">{getErrorMessage(existing.error)}</Alert>;
  }
  if (existing.data?.status === 'RETIRED') {
    return (
      <Card className="mx-auto max-w-3xl space-y-3 p-6">
        <Alert variant="error">El ítem está dado de baja y no se puede modificar.</Alert>
        <Link to="/items" className={`${TEXT_LINK_CLASSES} text-sm`}>
          Volver al catálogo
        </Link>
      </Card>
    );
  }

  function handleSubmit(values: ItemFormValues) {
    const request = {
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      categoryId: Number(values.categoryId),
    };
    const options = { onSuccess: () => navigate('/items') };
    if (itemId === undefined) {
      createItem.mutate(request, options);
    } else {
      updateItem.mutate({ ...request, status: lockedStatus ?? values.status }, options);
    }
  }

  const lockedStatus = existing.data?.status === 'ON_LOAN' ? existing.data.status : undefined;

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader
        title={itemId === undefined ? 'Nuevo ítem' : 'Editar ítem'}
        description="Datos del ítem en el inventario."
      />
      <Card className="p-6">
        <ItemForm
          mode={itemId === undefined ? 'create' : 'edit'}
          categories={categories.data}
          initialValues={
            existing.data && {
              code: existing.data.code,
              name: existing.data.name,
              description: existing.data.description ?? '',
              categoryId: String(existing.data.category.id),
              status: existing.data.status,
            }
          }
          lockedStatus={lockedStatus}
          isSubmitting={mutation.isPending}
          errorMessage={mutation.isError ? getErrorMessage(mutation.error) : undefined}
          onSubmit={handleSubmit}
        />
      </Card>
    </section>
  );
}
