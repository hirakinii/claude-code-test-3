import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Collapse,
  Typography,
  Divider,
} from '@mui/material';
import {
  Delete,
  Edit,
  DragHandle,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { Schema, Category, schemaApi } from '../../api/schemaApi';
import FieldList from './FieldList';

interface CategoryListProps {
  schema: Schema;
  onUpdate: () => void;
  token: string;
}

interface SortableItemProps {
  category: Category;
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  token: string;
  onUpdateFields: () => void;
}

function SortableItem({
  category,
  onDelete,
  onEdit,
  token,
  onUpdateFields,
}: SortableItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <ListItem
        ref={setNodeRef}
        style={style}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box {...attributes} {...listeners} sx={{ mr: 2, cursor: 'grab' }}>
          <DragHandle />
        </Box>
        <ListItemText
          primary={category.name}
          secondary={
            <>
              {category.description && (
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {category.fields.length} フィールド
              </Typography>
            </>
          }
        />
        <Chip
          label={`順序: ${category.displayOrder}`}
          size="small"
          sx={{ mr: 1 }}
        />
        <IconButton
          edge="end"
          aria-label="expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <IconButton
          edge="end"
          aria-label="edit"
          onClick={() => onEdit(category)}
        >
          <Edit />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(category.id)}
        >
          <Delete />
        </IconButton>
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <FieldList
            category={category}
            token={token}
            onUpdate={onUpdateFields}
          />
        </Box>
      </Collapse>
    </>
  );
}

function CategoryList({ schema, onUpdate, token }: CategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = schema.categories.findIndex((c) => c.id === active.id);
    const newIndex = schema.categories.findIndex((c) => c.id === over.id);

    const reorderedCategories = arrayMove(schema.categories, oldIndex, newIndex);

    // 各カテゴリの displayOrder を更新
    try {
      for (let i = 0; i < reorderedCategories.length; i++) {
        const category = reorderedCategories[i];
        if (!category) continue;
        await schemaApi.updateCategory(
          category.id,
          { displayOrder: i + 1 },
          token
        );
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      alert('カテゴリの順序変更に失敗しました');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (
      window.confirm(
        'このカテゴリを削除しますか？\n関連するフィールドもすべて削除されます。'
      )
    ) {
      try {
        await schemaApi.deleteCategory(categoryId, token);
        onUpdate();
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('カテゴリの削除に失敗しました');
      }
    }
  };

  const handleEdit = (category: Category) => {
    // TODO: 編集モーダルを開く
    console.log('Edit category:', category);
  };

  if (!schema.categories || schema.categories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          カテゴリがありません。「カテゴリを追加」ボタンから作成してください。
        </Typography>
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={schema.categories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <List>
          {schema.categories.map((category) => (
            <SortableItem
              key={category.id}
              category={category}
              onDelete={handleDelete}
              onEdit={handleEdit}
              token={token}
              onUpdateFields={onUpdate}
            />
          ))}
        </List>
      </SortableContext>
    </DndContext>
  );
}

export default CategoryList;
