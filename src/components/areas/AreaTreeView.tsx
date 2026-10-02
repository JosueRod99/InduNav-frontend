import { Building2, Users } from 'lucide-react';
import TreeView from '../ui/TreeView';
import type { TreeNode } from '../ui/TreeView';
import type { AreaTreeNode } from '../../api/areas';
import Badge from '../ui/Badge';

interface AreaTreeViewProps {
  areas: AreaTreeNode[];
  onAreaClick?: (area: AreaTreeNode) => void;
  selectedAreaId?: string;
  className?: string;
  expandAll?: boolean;
  showEmployeeCount?: boolean;
}

const AreaTreeView = ({
  areas,
  onAreaClick,
  selectedAreaId,
  className = '',
  expandAll = false,
  showEmployeeCount = true,
}: AreaTreeViewProps) => {
  // Transform AreaTreeNode to TreeNode format
  const transformToTreeNode = (area: AreaTreeNode): TreeNode & AreaTreeNode => {
    return {
      ...area,
      label: area.name,
      children: area.children?.map(transformToTreeNode),
    };
  };

  const treeData = areas.map(transformToTreeNode);

  const renderAreaNode = (node: TreeNode & AreaTreeNode, isExpanded: boolean, hasChildren: boolean) => {
    const areaTypeColors: Record<string, string> = {
      production: 'bg-blue-100 text-blue-800',
      warehouse: 'bg-yellow-100 text-yellow-800',
      office: 'bg-gray-100 text-gray-800',
      quality: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      general: 'bg-purple-100 text-purple-800',
    };

    return (
      <div className="flex items-center gap-2 w-full">
        {/* Area Color Indicator */}
        {node.color && (
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.color }}
          />
        )}

        {/* Area Icon */}
        <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />

        {/* Area Name */}
        <span className="font-medium truncate flex-1">{node.name}</span>

        {/* Area Code */}
        {node.code && (
          <span className="text-xs text-gray-500 flex-shrink-0">({node.code})</span>
        )}

        {/* Employee Count */}
        {showEmployeeCount && node.employee_count !== undefined && node.employee_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
            <Users className="w-3 h-3" />
            <span>{node.employee_count}</span>
          </div>
        )}

        {/* Area Type Badge */}
        {node.area_type && (
          <Badge
            variant="default"
            className={`text-xs flex-shrink-0 ${areaTypeColors[node.area_type] || 'bg-gray-100 text-gray-800'}`}
          >
            {node.area_type}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <TreeView
      data={treeData}
      onNodeClick={(node) => onAreaClick?.(node)}
      selectedId={selectedAreaId}
      renderNode={renderAreaNode}
      className={className}
      expandAll={expandAll}
    />
  );
};

export default AreaTreeView;
