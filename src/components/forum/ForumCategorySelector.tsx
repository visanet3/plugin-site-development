import { ForumCategory } from '@/types';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ForumCategorySelectorProps {
  categories: ForumCategory[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number) => void;
}

const ForumCategorySelector = ({
  categories,
  selectedCategory,
  onSelectCategory
}: ForumCategorySelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Выберите категорию *</label>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center gap-2 border hover:brightness-110"
            style={{
              backgroundColor: selectedCategory === category.id ? `${category.color}25` : `${category.color}12`,
              borderColor: selectedCategory === category.id ? `${category.color}50` : `${category.color}30`,
              color: selectedCategory === category.id ? category.color : `${category.color}cc`
            }}
          >
            <Icon name={category.icon as any} size={16} />
            {category.name}
            {selectedCategory === category.id && (
              <Icon name="Check" size={14} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ForumCategorySelector;