
'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Hourglass, ShieldAlert, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { SystemAlert } from '@/app/api/admin/alerts/route'; // Import the type
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const severityIcons: { [key: string]: React.ReactElement } = {
  Critical: <AlertCircle className="h-5 w-5 text-red-600" />,
  High: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  Medium: <Info className="h-5 w-5 text-yellow-500" />,
  Low: <Info className="h-5 w-5 text-blue-500" />,
};

const statusColors: { [key: string]: string } = {
    New: 'bg-blue-500 hover:bg-blue-600',
    Investigating: 'bg-yellow-500 hover:bg-yellow-600 text-yellow-foreground',
    ActionRequired: 'bg-orange-500 hover:bg-orange-600',
    Resolved: 'bg-green-500 hover:bg-green-600',
    Dismissed: 'bg-gray-500 hover:bg-gray-600',
}

type AlertStatus = SystemAlert['status'];

export default function SystemAlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<'active' | 'all'>('active');


  async function fetchAlerts(filter: 'active' | 'all' = activeFilter) {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add auth headers if required
      const response = await fetch(`/api/admin/alerts?filter=${filter}`);
      if (response.status === 403) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view alerts.' });
        setError('Access Denied.');
        setAlerts([]);
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch alerts.');
      }
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
       if (errorMessage !== 'Access Denied.') {
        toast({ variant: 'destructive', title: 'Error Fetching Alerts', description: errorMessage });
      }
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts(activeFilter);
  }, [activeFilter]);

  const handleAlertAction = async (alertId: string, newStatus: AlertStatus) => {
    // Optimistically update UI (optional)
    // const originalAlerts = [...alerts];
    // setAlerts(prevAlerts => prevAlerts.map(a => a.id === alertId ? {...a, status: newStatus, isLoading: true} : a ));

    try {
      // TODO: Add auth headers if required for PATCH
      const response = await fetch(`/api/admin/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        // setAlerts(originalAlerts); // Revert optimistic update
        toast({ variant: 'destructive', title: `Failed to ${newStatus} Alert`, description: result.message || 'An error occurred.' });
        return;
      }
      
      toast({ title: 'Alert Status Updated', description: `Alert marked as ${newStatus}.` });
      
      // Refetch or update local state more precisely
      // For simplicity, refetching active alerts if the alert was moved to Resolved/Dismissed
      if (activeFilter === 'active' && (newStatus === 'Resolved' || newStatus === 'Dismissed')) {
         setAlerts(prevAlerts => prevAlerts.filter(a => a.id !== alertId));
      } else {
        setAlerts(prevAlerts => 
            prevAlerts.map(alert => 
                alert.id === alertId ? { ...result.alert, created_at: new Date(result.alert.created_at).toISOString(), updated_at: new Date(result.alert.updated_at).toISOString(), resolved_at: result.alert.resolved_at ? new Date(result.alert.resolved_at).toISOString() : null } : alert
            )
        );
      }


    } catch (err) {
      // setAlerts(originalAlerts); // Revert optimistic update
      const errorMessage = err instanceof Error ? err.message : 'An unknown network error occurred.';
      toast({ variant: 'destructive', title: 'Action Failed', description: errorMessage });
    }
  };


  return (
    <div className="space-y-8">
      <PageTitle title="System Alerts" description="Review important system notifications and alerts." />
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              System Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>
              {activeFilter === 'active' ? 'Active alerts requiring attention.' : 'Showing all alerts.'}
            </CardDescription>
          </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter: {activeFilter === 'active' ? 'Active' : 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter Alerts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setActiveFilter('active')}>
                Show Active
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('all')}>
                Show All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center p-10">
              <Hourglass className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading alerts...</p>
            </div>
          )}
          {!isLoading && error && (
             <Card className="border-destructive bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert /> Error Loading Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
                <Button onClick={() => fetchAlerts(activeFilter)} className="mt-4" variant="secondary">Try Again</Button>
              </CardContent>
            </Card>
          )}
          {!isLoading && !error && alerts.length === 0 && (
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center bg-muted/20">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">
                {activeFilter === 'active' ? 'No Active Alerts' : 'No Alerts Found'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {activeFilter === 'active' 
                    ? 'All systems go! There are no active alerts requiring attention.' 
                    : 'There are no alerts matching the current filter.'}
              </p>
            </div>
          )}
          {!isLoading && !error && alerts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className={`${alert.severity === 'Critical' ? 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' : ''}`}>
                    <TableCell className="text-center">
                      {severityIcons[alert.severity] || <Info className="h-5 w-5" />}
                    </TableCell>
                    <TableCell className="font-medium">{alert.type}</TableCell>
                    <TableCell>
                      {alert.message}
                      {alert.details_url && (
                        <Link href={alert.details_url} target="_blank" className="ml-2 text-xs text-primary hover:underline">(Details)</Link>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="default" className={cn("text-white", statusColors[alert.status] || 'bg-gray-400')}>{alert.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">
                      {format(new Date(alert.created_at), 'MMM dd, yyyy - HH:mm')}
                    </TableCell>
                    <TableCell className="text-right space-x-1 space-y-1 sm:space-y-0">
                      {alert.status === 'New' && (
                        <Button variant="outline" size="sm" onClick={() => handleAlertAction(alert.id, 'Investigating')}>Investigate</Button>
                      )}
                       {(alert.status === 'New' || alert.status === 'Investigating' || alert.status === 'ActionRequired') && (
                        <Button variant="default" size="sm" onClick={() => handleAlertAction(alert.id, 'Resolved')} className="bg-green-600 hover:bg-green-700">Resolve</Button>
                      )}
                       {alert.status !== 'Dismissed' && alert.status !== 'Resolved' && (
                         <Button variant="ghost" size="sm" onClick={() => handleAlertAction(alert.id, 'Dismissed')}>Dismiss</Button>
                       )}
                       {(alert.status === 'Dismissed' || alert.status === 'Resolved') && (
                          <Button variant="outline" size="sm" onClick={() => handleAlertAction(alert.id, 'New')}>Re-Open</Button>
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
