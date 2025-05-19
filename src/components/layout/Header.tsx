
'use client'; // Header needs to be a client component to use useAuth

import Link from 'next/link';
import { Bike, User, LogIn, UserPlus, Trophy, Compass, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export function Header() {
  const { user, isLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // The logout function in AuthContext already handles redirection
  };
  
  // TODO: For production, the actual check for isAdmin from token/session will be on server-side for route protection.
  // Client-side check using user.is_admin from context is for UI rendering.
  const isAdmin = user?.is_admin || false; 

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Bike className="h-8 w-8" />
          <span className="font-bold text-xl">Yamaha Blue Streaks</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
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
          {/* Show Admin Panel link if user is loaded and is an admin */}
          {!isLoading && user && isAdmin && (
            <Button variant="ghost" asChild>
              <Link href="/admin" className="flex items-center gap-1">
                <Shield size={18} /> Admin Panel
              </Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png`} alt={user.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    {user.email && (
                       <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User size={16} /> Profile
                  </Link>
                </DropdownMenuItem>
                {/* TODO: Add settings link if needed
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut size={16} /> Logout
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
