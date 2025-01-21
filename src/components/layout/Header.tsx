import { Button } from "@/components/ui/button";
import { LogOut, User, Calendar as CalendarIcon, List, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  userEmail?: string;
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  onSignOut: () => void;
}

export function Header({ userEmail, viewMode, onViewModeChange, onSignOut }: HeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Task Manager
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {!isMobile && (
              <>
                <div className="hidden md:flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('list')}
                    className="relative"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('calendar')}
                    className="relative"
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Calendar
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6 hidden md:block" />
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  {!isMobile && (
                    <span className="text-sm text-gray-600 hidden md:inline-block">
                      {userEmail}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isMobile && (
                  <>
                    <DropdownMenuItem onClick={() => onViewModeChange('list')}>
                      <List className="h-4 w-4 mr-2" />
                      List View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewModeChange('calendar')}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Calendar View
                    </DropdownMenuItem>
                    <Separator className="my-2" />
                  </>
                )}
                <DropdownMenuItem onClick={onSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}