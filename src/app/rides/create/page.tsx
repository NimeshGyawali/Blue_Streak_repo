
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, PlusCircle } from "lucide-react"
import { format, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { PageTitle } from '@/components/ui/PageTitle';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const createRideSchemaClient = z.object({
  name: z.string().min(5, { message: 'Ride name must be at least 5 characters.' }).max(100),
  startPoint: z.string().min(3, { message: 'Start point is required.' }),
  endPoint: z.string().min(3, { message: 'End point is required (can be same as start for round trips).' }),
  dateTime: z.date({
    required_error: "Ride date and time is required.",
  }),
  description: z.string().max(500, { message: 'Description must be 500 characters or less.' }).optional(),
  // mapLink: z.string().url({ message: "Please enter a valid URL for the map link."}).optional().or(z.literal('')),
});

// Type for server-side payload
type CreateRidePayload = {
  name: string;
  startPoint: string;
  endPoint: string;
  dateTime: string; // ISO string
  description?: string;
  // mapLink?: string;
};


export default function CreateRidePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof createRideSchemaClient>>({
    resolver: zodResolver(createRideSchemaClient),
    defaultValues: {
      name: '',
      startPoint: '',
      endPoint: '',
      description: '',
      // mapLink: '',
    },
  });

  async function onSubmit(values: z.infer<typeof createRideSchemaClient>) {
    setIsLoading(true);

    const payload: CreateRidePayload = {
      ...values,
      dateTime: values.dateTime.toISOString(), // Convert Date object to ISO string for API
    };

    try {
      // TODO: Add authorization header if your API requires it
      // const token = getAuthToken(); // Your function to get token
      // const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Micro-Ride Created!',
          description: result.message || `Your ride "${values.name}" has been created and listed.`,
        });
        form.reset();
        // Optionally, redirect to the new ride's page or the main rides list
        // router.push(result.ride ? `/rides/${result.ride.id}` : '/rides');
        router.push('/rides');
      } else {
         toast({
          variant: 'destructive',
          title: 'Failed to Create Ride',
          description: result.message || 'An unexpected error occurred. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Could not connect to the server. Please try again later.',
      });
      console.error("Create ride error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Create a Micro-Ride" description="Organize a spontaneous ride with fellow Yamaha enthusiasts." />
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>New Micro-Ride Details</CardTitle>
          <CardDescription>Fill in the details below to create your ride. Micro-Rides are user-organized and auto-approved.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ride Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sunday Morning Coffee Run" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Point</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Street Cafe or specific address" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Point / General Area</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Scenic Viewpoint Park or same as start" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date and Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value && isValid(field.value) ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                          }
                          initialFocus
                        />
                        <div className="p-2 border-t">
                           <Input 
                            type="time"
                            defaultValue={field.value && isValid(field.value) ? format(field.value, "HH:mm") : undefined}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = field.value && isValid(field.value) ? new Date(field.value) : new Date();
                              if (!isNaN(hours) && !isNaN(minutes)) {
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                              }
                            }}
                            disabled={isLoading}
                           />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the date and time for your ride.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Quick ride for coffee and chat, all welcome!" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Optional: Map Link
              <FormField
                control={form.control}
                name="mapLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Map Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., https://maps.google.com/..." {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} className="mr-2" /> Create Ride
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
