import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/language";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors text-sm font-medium ${className || ''}`}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block capitalize">
            {language === 'en' ? 'English' : language === 'ha' ? 'Hausa' : language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'Swahili'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('ha')}>Hausa</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('fr')}>French</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('ar')}>Arabic</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('sw')}>Swahili</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
