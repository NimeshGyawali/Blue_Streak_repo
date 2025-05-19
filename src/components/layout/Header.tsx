
import Link from 'next/link';
import { Bike, User, LogIn, UserPlus, Trophy, Compass, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  // Mock user state
  const isLoggedIn = false; 
  const userName = "Rider One";
  // TODO: Replace this mock isAdmin flag with actual admin state detection from your auth system
  const isAdmin = true; 

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Bike className="h-8 w-8" />
          <span className="font-bold text-xl">Yamaha Blue Streaks</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/rides" className="flex items-center gap-1">
              <Compass size={18} /> Rides
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/leaderboard" className="flex items-center gap-1">
              <Trophy size={18} /> Leaderboard
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" asChild>
              <Link href="/admin" className="flex items-center gap-1">
                <Shield size={18} /> Admin Panel
              </Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://placehold.co/100x100.png" alt={userName} data-ai-hint="person avatar" />
                    <AvatarFallback>{userName?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {/* user.email - if available */}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                {/* Conditionally render Admin Panel link here too if desired for logged-in admins */}
                {/* {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )} */}
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/auth/login" className="flex items-center gap-1">
                  <LogIn size={16} /> Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup" className="flex items-center gap-1">
                  <UserPlus size={16} /> Sign Up
                </Link>
              </Button>
            </>
          )}
           {/* Mobile Menu Trigger (optional, can be expanded later) */}
           {/* <Button variant="ghost" size="icon" className="md:hidden"> <Menu /> </Button> */}
        </div>
      </div>
    </header>
  );
}
