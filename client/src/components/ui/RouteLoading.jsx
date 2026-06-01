import { LoadingSpinner } from './LoadingSpinner.jsx';

export function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <LoadingSpinner label="Loading page…" />
    </div>
  );
}
