import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
import EditBlockDialog from "./EditBlockDialog";

function SubjectItem({ item, onDragStart, onDragEnd, onDelete, onEdit }) {
  const handleEdit = () => {
    onEdit(item);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      className="group bg-card p-3 rounded-lg border shadow-sm mb-2 hover:shadow-md transition-all cursor-move"
      style={{
        borderColor: item.color,
        borderWidth: "2px",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate text-foreground">
            {item.name}
          </h4>
          <span className="text-xs text-muted-foreground">{item.duration}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function WeekDay({ items = [], onDragStart, onDragEnd, onDelete, onEdit }) {
  const [selectedBlock, setSelectedBlock] = React.useState(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const handleEdit = (block) => {
    setSelectedBlock(block);
    setEditDialogOpen(true);
  };

  const handleSave = (editedBlock) => {
    onEdit(editedBlock);
    setEditDialogOpen(false);
    setSelectedBlock(null);
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <SubjectItem
          key={item.id}
          item={item}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDelete={onDelete}
          onEdit={handleEdit}
        />
      ))}
      <EditBlockDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        block={selectedBlock}
        onSave={handleSave}
      />
    </div>
  );
}

export default WeekDay;
