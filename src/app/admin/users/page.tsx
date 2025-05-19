
'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle, XCircle, UserCheck, Hourglass, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  city: string | null;
  bike_model: string | null;
  vin: string | null;
  is_verified: boolean;
  is_captain: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function fetchUsers() {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: If your API requires auth tokens, include them in the headers
      // const token = getAuthToken(); // Your function to get the token
      // const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch('/api/admin/users'/*, { headers }*/);
      
      if (response.status === 403) { // Forbidden
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
        });
        router.push('/auth/login'); // Or to a "not authorized" page or home
        throw new Error('Forbidden: Administrator access required.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage !== 'Forbidden: Administrator access required.') { // Avoid double toast for 403
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error fetching users',
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleVerifyUser(userId: string) {
    try {
      // TODO: If your API requires auth tokens, include them in the headers
      // const token = getAuthToken();
      // const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        // headers,
      });

      if (response.status === 403) {
         toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to perform this action.' });
         return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to verify user ${userId}.`);
      }

      const updatedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, is_verified: updatedUser.user.is_verified } : user
        )
      );
      toast({
        title: 'User Verified',
        description: `User ${updatedUser.user.name} has been successfully verified.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: errorMessage,
      });
    }
  }

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
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert /> Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchUsers} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="User Management" description="Verify new users, manage roles, and view account details." />
      <Card>
        <CardHeader>
          <CardTitle>User List ({users.length})</CardTitle>
          <CardDescription>
            View, search, and manage all registered users. Use the actions to verify pending users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead className="hidden lg:table-cell">Bike Model</TableHead>
                  <TableHead className="hidden lg:table-cell">VIN (Partial)</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Registered</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.city || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user.bike_model || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.vin ? `${user.vin.substring(0, 4)}...${user.vin.substring(user.vin.length - 4)}` : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center text-xs">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
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
                      {/* Add more actions like 'Edit', 'Delete', 'Make Captain' here later */}
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
