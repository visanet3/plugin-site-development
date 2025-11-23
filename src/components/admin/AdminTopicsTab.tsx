import { useState } from 'react';
import { ForumTopic } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminTopicsTabProps {
  topics: ForumTopic[];
  onEditTopic: (topic: ForumTopic) => void;
  onDeleteTopic: (topicId: number) => void;
  onUpdateViews: (topicId: number, views: number) => void;
}

const AdminTopicsTab = ({ topics, onEditTopic, onDeleteTopic, onUpdateViews }: AdminTopicsTabProps) => {
  const [editingViews, setEditingViews] = useState<number | null>(null);
  const [viewsValue, setViewsValue] = useState('');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Управление темами форума</h2>
        <span className="text-sm text-muted-foreground">
          Всего тем: {topics.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {topics.map(topic => (
          <div
            key={topic.id}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{topic.title}</h3>
                  {topic.is_pinned && (
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                      Закреплено
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {topic.content?.substring(0, 150)}...
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="User" size={14} />
                    {topic.author_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Icon name="Eye" size={14} />
                    {editingViews === topic.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={viewsValue}
                          onChange={(e) => setViewsValue(e.target.value)}
                          className="w-20 h-6 text-xs px-1"
                          min="0"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onUpdateViews(topic.id, parseInt(viewsValue) || 0);
                            setEditingViews(null);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Icon name="Check" size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingViews(null)}
                          className="h-6 w-6 p-0"
                        >
                          <Icon name="X" size={12} />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingViews(topic.id);
                          setViewsValue(topic.views?.toString() || '0');
                        }}
                        className="hover:text-primary transition-colors underline"
                      >
                        {topic.views}
                      </button>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Icon name="MessageSquare" size={14} />
                    {topic.comments_count || 0}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditTopic(topic)}
                  disabled
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteTopic(topic.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTopicsTab;