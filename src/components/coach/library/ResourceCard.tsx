import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Play, 
  FileText, 
  Link2, 
  FileEdit, 
  MoreVertical, 
  Trash2, 
  ExternalLink 
} from "lucide-react";
import type { ContentItem, ContentType } from "@/hooks/useContentLibrary";
import { formatDistanceToNow } from "date-fns";

interface ResourceCardProps {
  resource: ContentItem;
  onDelete: (id: string) => void;
}

const typeIcons: Record<ContentType, React.ReactNode> = {
  video: <Play className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  link: <Link2 className="h-5 w-5" />,
  text: <FileEdit className="h-5 w-5" />,
};

const typeColors: Record<ContentType, string> = {
  video: "bg-red-500/10 text-red-500",
  pdf: "bg-blue-500/10 text-blue-500",
  link: "bg-green-500/10 text-green-500",
  text: "bg-purple-500/10 text-purple-500",
};

export function ResourceCard({ resource, onDelete }: ResourceCardProps) {
  const handleOpen = () => {
    if (resource.url) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
              {typeIcons[resource.type]}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Added {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {resource.url && (
                <DropdownMenuItem onClick={handleOpen}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(resource.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {resource.url && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 gap-2"
            onClick={handleOpen}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Resource
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
