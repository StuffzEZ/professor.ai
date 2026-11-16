import { BookOpen } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ActionConfig {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
}

interface Props {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ActionConfig;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-muted">
        {icon || <BookOpen size={20} />}
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="text-sm text-text-secondary max-w-sm">{description}</p>
      {action && (
        <Link to={action.href}>
          <Button variant={action.variant ?? 'primary'}>
            {action.icon}
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}