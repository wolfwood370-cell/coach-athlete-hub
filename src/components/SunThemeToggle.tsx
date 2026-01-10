import { Sun, Moon, Sunrise, MapPin, MapPinOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSunTheme } from '@/hooks/useSunTheme';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SunThemeToggle() {
  const { isEnabled, setIsEnabled, sunTimes, locationStatus, currentTheme } = useSunTheme();

  const getStatusIcon = () => {
    if (!isEnabled) return null;
    
    switch (locationStatus) {
      case 'granted':
        return <MapPin className="h-3 w-3 text-success" />;
      case 'denied':
      case 'unavailable':
        return <MapPinOff className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!isEnabled) return null;
    
    if (locationStatus === 'denied' || locationStatus === 'unavailable') {
      return 'Usando orari predefiniti (06:00 - 19:00)';
    }
    
    if (sunTimes) {
      return `Alba: ${format(sunTimes.sunrise, 'HH:mm', { locale: it })} • Tramonto: ${format(sunTimes.sunset, 'HH:mm', { locale: it })}`;
    }
    
    return 'Caricamento...';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Switch
          id="sun-theme"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
        />
        <Label 
          htmlFor="sun-theme" 
          className="flex items-center gap-2 cursor-pointer text-sm"
        >
          <Sunrise className="h-4 w-4 text-warning" />
          <span>Tema Automatico (Alba/Tramonto)</span>
          {getStatusIcon()}
        </Label>
        
        {isEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                {currentTheme === 'dark' ? (
                  <Moon className="h-3 w-3" />
                ) : (
                  <Sun className="h-3 w-3" />
                )}
                <span className="capitalize">{currentTheme}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tema attuale basato sull'ora</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {isEnabled && (
        <p className="text-xs text-muted-foreground pl-10">
          {getStatusText()}
        </p>
      )}
    </div>
  );
}
