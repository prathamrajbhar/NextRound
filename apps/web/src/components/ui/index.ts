// Barrel export for the hand-built UI primitive library (Tailwind + custom
// CSS, no external component-library dependency). Import from '@/components/ui'.

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input, Textarea } from './Input';
export type { InputProps, TextareaProps } from './Input';

export { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './Card';
export type { CardProps, CardAccent } from './Card';

export { Badge, statusToIntent } from './Badge';
export type { BadgeProps, BadgeIntent } from './Badge';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps } from './Tabs';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { Autocomplete } from './Autocomplete';
export type { AutocompleteProps } from './Autocomplete';

export { SearchableSelect } from './SearchableSelect';
export type { SearchableSelectProps, SearchableSelectOption } from './SearchableSelect';

export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  JobsGridSkeleton,
  ApplicationsListSkeleton,
  HrStatsSkeleton,
  AnalyticsGridSkeleton,
  PageHeaderSkeleton,
  FormCardSkeleton,
  NotificationsListSkeleton,
  MockHistorySkeleton,
  ResumesListSkeleton,
  JobDetailSkeleton,
  ApplicationDetailSkeleton,
  CandidateDetailSkeleton,
  PipelineBoardSkeleton,
} from './Skeleton';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from './Table';
export type { TableProps, TableRowProps, TableHeadCellProps, TableCellProps } from './Table';

export { RadarChart } from './RadarChart';
export type { RadarChartProps, RadarSeries } from './RadarChart';

export { ClusterPlot } from './ClusterPlot';
export type { ClusterPlotProps, ClusterPoint } from './ClusterPlot';

export { ThemeToggle } from './ThemeToggle';

export { CompanyLogo } from './CompanyLogo';

export { JobCard } from './JobCard';
export type { JobCardProps } from './JobCard';

export { FormattedMarkdown } from './FormattedMarkdown';

