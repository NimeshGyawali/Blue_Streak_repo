
'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ListChecks, BarChartHorizontalBig, CheckCircle, XCircle, Hourglass, ShieldAlert, Bike } from 'lucide-react';
import type { Ride } from '@/types'; // Make sure Ride type includes captain object with name

export default function RideManagementPage() {
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function fetchPendingRides() {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: If your API requires auth tokens, include them in the headers
      const response = await fetch('/api/admin/rides/pending');
      
      if (response.status === 403) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view pending rides.',
        });
        throw new Error('Forbidden: Administrator access required for pending rides.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pending rides.');
      }
      const data = await response.json();
      setPendingRides(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       if (errorMessage !== 'Forbidden: Administrator access required for pending rides.') {
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Rides',
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingRides();
  }, [toast]); // Added toast to dependencies as it's used in fetchPendingRides

  const handleApproveRide = async (rideId: string) => {
    try {
      // TODO: If your API requires auth tokens, include them in the headers
      // const token = getAuthToken();
      // const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`/api/admin/rides/${rideId}/approve`, {
        method: 'PATCH',
        // headers,
      });

      if (response.status === 403) {
         toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to perform this action.' });
         return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to approve ride ${rideId}.`);
      }

      const result = await response.json();
      setPendingRides((prevRides) => prevRides.filter(ride => ride.id !== rideId));
      toast({
        title: 'Ride Approved',
        description: result.message || `Ride ${result.ride?.name || rideId} has been approved.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: errorMessage,
      });
    }
  };

  const handleRejectRide = async (rideId: string) => {
    try {
      // TODO: If your API requires auth tokens, include them in the headers
      // const token = getAuthToken();
      // const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`/api/admin/rides/${rideId}/reject`, {
        method: 'PATCH',
        // headers,
        // body: JSON.stringify({ reason: 'Optional rejection reason' }) // If you implement reason in API
      });

       if (response.status === 403) {
         toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to perform this action.' });
         return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to reject ride ${rideId}.`);
      }
      const result = await response.json();
      setPendingRides((prevRides) => prevRides.filter(ride => ride.id !== rideId));
      toast({
        title: 'Ride Rejected',
        description: result.message || `Ride ${result.ride?.name || rideId} has been rejected.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Ride Management" description="Approve rides, view statistics, and manage ride details." />
      
      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2">
          <TabsTrigger value="approval" className="text-sm sm:text-base">
            <ListChecks className="mr-2 h-5 w-5" />
            Ride Approval
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-sm sm:text-base">
            <BarChartHorizontalBig className="mr-2 h-5 w-5" />
            Ride Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="approval">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Pending Ride Approvals ({pendingRides.length})</CardTitle>
              <CardDescription>
                Review and approve or reject Chapter or Flagship rides requiring moderation. Micro-Rides are typically auto-approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center p-10">
                  <Hourglass className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading pending rides...</p>
                </div>
              )}
              {!isLoading && error && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert /> Error Loading Rides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{error}</p>
                    <Button onClick={fetchPendingRides} className="mt-4">Try Again</Button>
                  </CardContent>
                </Card>
              )}
              {!isLoading && !error && pendingRides.length === 0 && (
                <div className="mt-4 p-8 border border-dashed rounded-lg text-center bg-muted/20">
                  <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">No Rides Pending Approval</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    All submitted rides requiring moderation have been processed.
                  </p>
                </div>
              )}
              {!isLoading && !error && pendingRides.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ride Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Captain</TableHead>
                      <TableHead className="hidden sm:table-cell">Date & Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRides.map((ride) => (
                      <TableRow key={ride.id}>
                        <TableCell className="font-medium">{ride.name}</TableCell>
                        <TableCell><Badge variant={ride.type === "Flagship" ? "default" : "secondary"}>{ride.type}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell">{ride.captain?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">
                          {format(new Date(ride.dateTime), 'MMM dd, yyyy - HH:mm')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleApproveRide(ride.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            <CheckCircle size={16} className="mr-1" /> Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRejectRide(ride.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <XCircle size={16} className="mr-1" /> Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Ride Statistics Overview</CardTitle>
              <CardDescription>
                Analyze ride data, participation trends, and other key metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mt-4 p-8 border border-dashed rounded-lg text-center bg-muted/20">
                <BarChartHorizontalBig className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Ride Statistics Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Visual charts and data summaries for total rides, rides by type, participant numbers, popular routes, captain performance, etc., will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    
