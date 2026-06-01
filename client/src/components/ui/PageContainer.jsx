import { cn } from '../../utils/cn.js';

/**
 * @param {{ narrow?: boolean; className?: string; children: import('react').ReactNode }} props
 */
export function PageContainer({ narrow = false, className, children }) {
  return (
    <div className={cn(narrow ? 'page-container-narrow' : 'page-container', className)}>
      {children}
    </div>
  );
}
