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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className={`p-4 cursor-pointer transition-all hover:scale-105 ${
              selectedCategory === category.id
                ? 'border-2 ring-2 ring-offset-2 ring-primary'
                : 'border hover:border-primary/50'
            }`}
            style={{
              borderColor: selectedCategory === category.id ? category.color : undefined,
              backgroundColor: selectedCategory === category.id ? `${category.color}10` : undefined
            }}
            onClick={() => onSelectCategory(category.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Icon
                  name={category.icon as any}
                  size={20}
                  style={{ color: category.color }}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{category.name}</h4>
                {category.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                )}
              </div>
              {selectedCategory === category.id && (
                <Icon name="Check" size={20} style={{ color: category.color }} />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ForumCategorySelector;
