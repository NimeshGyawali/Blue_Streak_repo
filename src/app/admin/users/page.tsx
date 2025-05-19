
'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For safety rating input
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle, UserCheck, Hourglass, ShieldAlert, ShieldCheck as AdminIcon, Star, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // For token
import type { User } from '@/types';

interface AdminUser extends User {
  created_at: string;
  safety_rating?: number | null; // Safety rating can be null or a number
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { token } = useAuth();
  const [editingRatings, setEditingRatings] = useState<{ [userId: string]: string }>({}); // Store rating as string for input

  async function fetchUsers() {
    setIsLoading(true);
    setError(null);
    if (!token) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Not authorized to view users.' });
      setIsLoading(false);
      router.push('/auth/login?redirect=/admin/users');
      return;
    }
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.status === 403) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        router.push('/admin');
        throw new Error('Forbidden: Administrator access required.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users.');
      }
      const data = await response.json();
      setUsers(data.map((u: any) => ({...u, safety_rating: u.safety_rating ?? null }))); // Ensure safety_rating is handled if null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (!errorMessage.includes('Forbidden')) {
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'Error fetching users', description: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [token]); // Refetch if token changes

  async function handleVerifyUser(userId: string) {
    if (!token) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Action requires authentication.' });
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 403) {
         toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to perform this action.' });
         return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to verify user ${userId}.`);
      }

      const result = await response.json();
      const updatedUserFromApi: AdminUser = {
        ...result.user,
        created_at: result.user.created_at || new Date().toISOString(), // ensure created_at exists
        safety_rating: result.user.safety_rating ?? null,
      };
      
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, ...updatedUserFromApi } : user
        )
      );
      toast({
        title: 'User Verified',
        description: `User ${updatedUserFromApi.name} has been successfully verified.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Verification Failed', description: errorMessage });
    }
  }

  const handleRatingChange = (userId: string, value: string) => {
    setEditingRatings(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveSafetyRating = async (userId: string) => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Action requires authentication.' });
      return;
    }
    const ratingStr = editingRatings[userId];
    if (ratingStr === undefined || ratingStr === null || ratingStr === '') {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Safety rating cannot be empty.' });
      return;
    }
    
    const ratingNum = parseInt(ratingStr, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      toast({ variant: 'destructive', title: 'Invalid Rating', description: 'Safety rating must be a number between 1 and 5.' });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/safety-rating`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ safetyRating: ratingNum }),
      });

      if (response.status === 403) {
         toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to perform this action.' });
         return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update safety rating for user ${userId}.`);
      }
      
      const result = await response.json();
      const updatedUserFromApi: Partial<AdminUser> = {
        ...result.user,
        safety_rating: result.user.safety_rating ?? null,
      };

      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUserFromApi } : u));
      setEditingRatings(prev => {
        const newState = { ...prev };
        delete newState[userId]; // Clear editing state for this user
        return newState;
      });
      toast({ title: 'Safety Rating Updated', description: `User ${result.user.name}'s safety rating updated to ${ratingNum}.` });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="User Management" description="Verify new users and manage existing accounts." />
        <div className="flex items-center justify-center p-10">
          <Hourglass className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageTitle title="User Management" description="Verify new users and manage existing accounts." />
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert /> Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchUsers} className="mt-4" variant="secondary">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="User Management" description="Verify new users, manage roles, and view account details including safety ratings." />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List ({users.length})</CardTitle>
          <CardDescription>
            View users, verify pending accounts, and manage safety ratings (1-5). Admin status is provisioned manually by superusers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 hidden sm:table-cell">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center w-28">Safety (1-5)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png`} alt={user.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user.city || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      {user.is_verified ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <CheckCircle size={14} className="mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-yellow-foreground">
                          <Hourglass size={14} className="mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                     <TableCell className="text-center">
                      {user.is_admin ? (
                        <Badge variant="destructive" className="bg-blue-600 hover:bg-blue-700">
                          <AdminIcon size={14} className="mr-1" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                           User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Star size={16} className={user.safety_rating && user.safety_rating >= 1 ? "text-yellow-400" : "text-muted-foreground"} />
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={editingRatings[user.id] ?? user.safety_rating?.toString() ?? ''}
                          onChange={(e) => handleRatingChange(user.id, e.target.value)}
                          className="h-8 w-16 text-center px-1"
                          placeholder="-"
                        />
                        {editingRatings[user.id] !== undefined && editingRatings[user.id] !== (user.safety_rating?.toString() ?? '') && (
                           <Button variant="ghost" size="sm" onClick={() => handleSaveSafetyRating(user.id)} className="p-1 h-auto text-green-600 hover:text-green-700">
                             <Save size={16} />
                           </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {!user.is_verified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyUser(user.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          <UserCheck size={16} className="mr-1" /> Verify
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                           Verified
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
