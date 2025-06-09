import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WebResultCard } from "../reportLoading/WebResultCard";
import { CitationNumber } from "./CitationNumber";

interface CitationTooltipProps {
  index: number;
  source: { url: string; title: string };
}

export const CitationTooltip = ({ index, source }: CitationTooltipProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <CitationNumber num={index + 1} />
      </PopoverTrigger>
      <PopoverContent className="!p-0 !border-0 !bg-transparent">
        <WebResultCard result={source} id={source.url} />
      </PopoverContent>
    </Popover>
  );
};
