import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage, LANGUAGE_OPTIONS, SupportedLanguage } from "@/context/language";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  
  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors text-sm font-medium ${className || ''}`}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block capitalize">
            {currentLang.label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        {LANGUAGE_OPTIONS.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as SupportedLanguage)}>
            {lang.label} ({lang.nativeLabel})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
