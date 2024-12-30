import { ArrowRight } from "lucide-react";
import { CardFooter } from "@/components/ui/card";

interface TaskLinksProps {
  links?: string[];
}

export function TaskLinks({ links }: TaskLinksProps) {
  if (!links?.length) return null;

  return (
    <CardFooter className="pt-2">
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
          >
            Link {index + 1}
            <ArrowRight className="h-3 w-3" />
          </a>
        ))}
      </div>
    </CardFooter>
  );
}