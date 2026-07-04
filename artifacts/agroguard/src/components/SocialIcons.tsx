import { socialLinks } from "@/data/site-config";
import { FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa";

interface SocialIconsProps {
  /** Color variant for different backgrounds */
  variant?: "light" | "dark" | "primary";
  /** Size of icons */
  size?: "sm" | "md";
}

const sizeMap = { sm: "h-8 w-8", md: "h-9 w-9" };
const iconSizeMap = { sm: 14, md: 16 };

const variantMap = {
  light: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
  dark: "bg-muted hover:bg-muted/80 text-foreground border border-border",
  primary: "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10",
};

export default function SocialIcons({ variant = "dark", size = "md" }: SocialIconsProps) {
  const iconSize = iconSizeMap[size];
  const links = [
    { href: socialLinks.facebook, icon: <FaFacebookF size={iconSize} />, label: "Facebook" },
    { href: socialLinks.linkedin, icon: <FaLinkedinIn size={iconSize} />, label: "LinkedIn" },
    { href: socialLinks.instagram, icon: <FaInstagram size={iconSize} />, label: "Instagram" },
  ];

  return (
    <div className="flex items-center gap-2">
      {links.map(({ href, icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`inline-flex items-center justify-center rounded-full transition-colors ${sizeMap[size]} ${variantMap[variant]}`}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
