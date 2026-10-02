import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  [key: string]: any; // Allow additional properties
}

interface TreeViewProps<T extends TreeNode> {
  data: T[];
  onNodeClick?: (node: T) => void;
  onNodeSelect?: (node: T) => void;
  selectedId?: string;
  renderNode?: (node: T, isExpanded: boolean, hasChildren: boolean) => React.ReactNode;
  className?: string;
  defaultExpandedIds?: string[];
  expandAll?: boolean;
}

function TreeView<T extends TreeNode>({
  data,
  onNodeClick,
  onNodeSelect,
  selectedId,
  renderNode,
  className = '',
  defaultExpandedIds = [],
  expandAll = false,
}: TreeViewProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(expandAll ? getAllNodeIds(data) : defaultExpandedIds)
  );

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedIds(newExpanded);
  };

  const handleNodeClick = (node: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNodeClick) {
      onNodeClick(node);
    }
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  const renderTreeNode = (node: T, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
          `}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={(e) => handleNodeClick(node, e)}
        >
          {/* Expand/Collapse Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleExpand(node.id);
              }
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )
            ) : (
              <span className="w-4" /> // Spacer for alignment
            )}
          </button>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            {renderNode ? renderNode(node, isExpanded, hasChildren) : <span>{node.label}</span>}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderTreeNode(child as T, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`overflow-auto ${className}`}>
      {data.map((node) => renderTreeNode(node, 0))}
    </div>
  );
}

// Helper function to get all node IDs (for expand all)
function getAllNodeIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  const traverse = (node: TreeNode) => {
    ids.push(node.id);
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return ids;
}

export default TreeView;
