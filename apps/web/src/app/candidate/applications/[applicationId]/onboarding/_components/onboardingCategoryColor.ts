export function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'paperwork':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'equipment':
      return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'access':
      return 'bg-blue-50 text-blue-700 border-blue-105';
    case 'training':
      return 'bg-indigo-50 text-indigo-75 border-indigo-100';
    default:
      return 'bg-emerald-50 text-emerald-75 border-emerald-100';
  }
}
