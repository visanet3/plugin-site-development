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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`relative p-3 rounded-md border transition-all hover:scale-[1.02] active:scale-95 ${
            selectedCategory === category.id
              ? 'bg-zinc-800/80 border-zinc-600 shadow-md'
              : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700'
          }`}
          onClick={() => onSelectCategory(category.id)}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                selectedCategory === category.id ? 'bg-zinc-700/50' : 'bg-zinc-800/50'
              }`}
            >
              <Icon
                name={category.icon as any}
                size={20}
                className="text-zinc-400"
              />
            </div>
            <span className="text-xs font-medium text-zinc-300 text-center line-clamp-2">
              {category.name}
            </span>
          </div>
          {selectedCategory === category.id && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ForumCategorySelector;